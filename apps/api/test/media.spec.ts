import { describe, it, expect, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { MediaService } from "../src/media/media.service";
import type { StorageProvider } from "../src/media/storage/storage.interface";

/**
 * Найважливіше тут — що файл впізнається за вмістом, а не за назвою.
 * Зловмисник може назвати скрипт «фото.jpg»; ми маємо його відхилити.
 *
 * Сховище — in-memory фейк (без реального fs/мережі): тести швидкі,
 * ізольовані й перевіряють саме логіку сервісу, а не диск.
 */

class FakeStorage implements StorageProvider {
  files = new Map<string, Buffer>();
  putCalls = 0;
  removedKeys: string[] = [];

  async put(key: string, buffer: Buffer): Promise<void> {
    this.putCalls++;
    this.files.set(key, buffer);
  }
  async get(key: string): Promise<Buffer> {
    const b = this.files.get(key);
    if (!b) throw new Error("not found");
    return b;
  }
  async remove(key: string): Promise<void> {
    this.removedKeys.push(key);
    this.files.delete(key);
  }
}

interface FakeRow {
  id: string;
  kind: string;
  title: string | null;
  mimeType: string | null;
  fileSizeBytes: bigint | null;
  status: string;
  storageChecksum: string;
  masterUri: string;
  createdAt: Date;
  uploadedByUser?: { displayName: string; email: string | null } | null;
}

function makePrisma() {
  const rows: FakeRow[] = [];
  let seq = 0;

  return {
    rows,
    mediaAsset: {
      findFirst: async ({ where }: { where: { storageChecksum: string } }) =>
        rows.find((r) => r.storageChecksum === where.storageChecksum) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) =>
        rows.find((r) => r.id === where.id) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        // Унікальний індекс storage_checksum — імітуємо P2002 при гонитві
        if (rows.some((r) => r.storageChecksum === data.storageChecksum)) {
          throw new Prisma.PrismaClientKnownRequestError("унікальність порушено", {
            code: "P2002",
            clientVersion: "test",
          });
        }
        const row: FakeRow = {
          id: `00000000-0000-0000-0000-${String(++seq).padStart(12, "0")}`,
          kind: data.kind as string,
          title: data.title as string,
          mimeType: data.mimeType as string,
          fileSizeBytes: data.fileSizeBytes as bigint,
          status: data.status as string,
          storageChecksum: data.storageChecksum as string,
          masterUri: data.masterUri as string,
          createdAt: new Date(),
        };
        rows.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = rows.findIndex((r) => r.id === where.id);
        const row = rows[idx];
        if (row?.title === "linked.png") {
          // Симулюємо файл, підключений як портрет (FK RESTRICT)
          throw new Prisma.PrismaClientKnownRequestError("foreign key constraint failed", {
            code: "P2003",
            clientVersion: "test",
          });
        }
        rows.splice(idx, 1);
        return row;
      },
      findMany: async ({
        where,
        skip = 0,
        take = 100,
      }: {
        where?: { kind?: string; status?: string; title?: { contains: string } };
        skip?: number;
        take?: number;
      }) => {
        let list = rows;
        if (where?.kind) list = list.filter((r) => r.kind === where.kind);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        if (where?.title) {
          const q = where.title.contains.toLowerCase();
          list = list.filter((r) => (r.title ?? "").toLowerCase().includes(q));
        }
        return list.slice(skip, skip + take);
      },
      count: async ({ where }: { where?: { kind?: string; status?: string } } = {}) => {
        let list = rows;
        if (where?.kind) list = list.filter((r) => r.kind === where.kind);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list.length;
      },
    },
  };
}

function svc() {
  const prisma = makePrisma();
  const storage = new FakeStorage();
  return { media: new MediaService(prisma as never, storage), prisma, storage };
}

const file = (buffer: Buffer, name = "f.bin") => ({
  originalname: name,
  mimetype: "application/octet-stream",
  size: buffer.length,
  buffer,
});

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(50)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(50)]);
const PDF = Buffer.concat([Buffer.from("%PDF-1.7"), Buffer.alloc(50)]);

describe("завантаження медіа", () => {
  let ctx: ReturnType<typeof svc>;
  beforeEach(() => {
    ctx = svc();
  });

  it("приймає справжній PNG і кладе його в сховище", async () => {
    const r = await ctx.media.upload(file(PNG, "portrait.png"), "user-1");
    expect(r.kind).toBe("photo");
    expect(r.mimeType).toBe("image/png");
    expect(ctx.storage.putCalls).toBe(1);
  });

  it("приймає JPEG і PDF", async () => {
    expect((await ctx.media.upload(file(JPEG), "u")).mimeType).toBe("image/jpeg");
    expect((await ctx.media.upload(file(PDF), "u")).kind).toBe("document");
  });

  it("відхиляє скрипт, замаскований під .jpg", async () => {
    const evil = Buffer.from('<?php system($_GET["c"]); ?>');
    await expect(ctx.media.upload(file(evil, "photo.jpg"), "u")).rejects.toThrow(BadRequestException);
    expect(ctx.storage.putCalls).toBe(0);
  });

  it("відхиляє HTML під виглядом зображення", async () => {
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    await expect(ctx.media.upload(file(html, "pic.png"), "u")).rejects.toThrow(BadRequestException);
  });

  it("відхиляє порожній файл", async () => {
    await expect(ctx.media.upload(file(Buffer.alloc(0)), "u")).rejects.toThrow(BadRequestException);
  });

  it("відхиляє завеликий файл", async () => {
    const big = { ...file(PNG), size: 999 * 1024 * 1024 };
    await expect(ctx.media.upload(big, "u")).rejects.toThrow(BadRequestException);
  });

  it("ключ у сховищі не залежить від наданого імені (захист від path traversal)", async () => {
    const r = await ctx.media.upload(file(PNG, "../../../etc/passwd.png"), "u");
    expect(r.url).not.toContain("..");
    expect(r.url).toContain(r.id);
    expect([...ctx.storage.files.keys()][0]).not.toContain("..");
  });

  it("статус нового файлу — чернетка (публікація лише після модерації)", async () => {
    const r = await ctx.media.upload(file(PNG), "u");
    expect(r.status).toBe("draft");
  });

  it("дедуплікація: той самий файл двічі не потрапляє у сховище вдруге", async () => {
    const first = await ctx.media.upload(file(PNG, "a.png"), "u");
    const second = await ctx.media.upload(file(PNG, "b.png"), "u");
    expect(second.id).toBe(first.id);
    expect(second.deduplicated).toBe(true);
    expect(ctx.storage.putCalls).toBe(1); // у сховище пішов лише один запис
  });

  it("гонитва одночасних завантажень (P2002) не падає 500-ю, а повертає наявний запис", async () => {
    // Імітуємо вікно гонитви: findFirst іще не бачить запис (перевірку вже
    // пройдено), але поки йде запит — інший процес встигає його вставити.
    // create() впирається в унікальний індекс і має впіймати P2002.
    const checksum = createHash("sha256").update(PNG).digest("hex");
    const originalFindFirst = ctx.prisma.mediaAsset.findFirst;
    let calls = 0;
    ctx.prisma.mediaAsset.findFirst = (async (args: never) => {
      calls++;
      if (calls === 1) return null; // перша перевірка — "вільно"
      return originalFindFirst(args); // виклик усередині catch — знаходить рядок
    }) as typeof originalFindFirst;

    ctx.prisma.rows.push({
      id: "race-winner",
      kind: "photo",
      title: "race.png",
      mimeType: "image/png",
      fileSizeBytes: BigInt(PNG.length),
      status: "draft",
      storageChecksum: checksum,
      masterUri: `${checksum}.png`,
      createdAt: new Date(),
    });

    const r = await ctx.media.upload(file(PNG), "u");
    expect(r.id).toBe("race-winner");
    expect(r.deduplicated).toBe(true);
  });
});

describe("адмінська медіатека", () => {
  let ctx: ReturnType<typeof svc>;
  beforeEach(async () => {
    ctx = svc();
    await ctx.media.upload(file(PNG, "photo.png"), "u1");
    await ctx.media.upload(file(JPEG, "linked.png"), "u2");
    await ctx.media.upload(file(PDF, "document.pdf"), "u1");
  });

  it("список повертає всі файли з пагінацією", async () => {
    const page = await ctx.media.adminList({ page: 1, pageSize: 2 });
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(2);
    expect(page.totalPages).toBe(2);
  });

  it("фільтрує за типом", async () => {
    const page = await ctx.media.adminList({ kind: "document" as never });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]!.kind).toBe("document");
  });

  it("фільтрує за пошуковим запитом у назві", async () => {
    const page = await ctx.media.adminList({ q: "photo" });
    expect(page.items.some((i) => i.title === "photo.png")).toBe(true);
  });

  it("змінює статус файлу", async () => {
    const [first] = (await ctx.media.adminList({})).items;
    const updated = await ctx.media.setStatus(first!.id, "published");
    expect(updated.status).toBe("published");
  });

  it("кидає 404 при зміні статусу неіснуючого файлу", async () => {
    await expect(ctx.media.setStatus("немає-такого", "published")).rejects.toThrow(NotFoundException);
  });

  it("видаляє файл і прибирає його зі сховища", async () => {
    const page = await ctx.media.adminList({ q: "document" });
    const id = page.items[0]!.id;
    const result = await ctx.media.remove(id);
    expect(result.ok).toBe(true);
    expect(ctx.storage.removedKeys.length).toBe(1);
  });

  it("не дає видалити файл, який десь використовується (FK RESTRICT)", async () => {
    const page = await ctx.media.adminList({ q: "linked" });
    const id = page.items[0]!.id;
    await expect(ctx.media.remove(id)).rejects.toThrow(BadRequestException);
    // і зі сховища нічого не прибрано — операція відкотилась повністю
    expect(ctx.storage.removedKeys).toHaveLength(0);
  });
});
