import { describe, it, expect, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { MediaService } from "../src/media/media.service";

/**
 * Найважливіше тут — що файл впізнається за вмістом, а не за назвою.
 * Зловмисник може назвати скрипт «фото.jpg»; ми маємо його відхилити.
 */
function svc() {
  const prisma = {
    mediaAsset: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        ...data,
        id: "00000000-0000-0000-0000-000000000001",
        createdAt: new Date(),
      }),
    },
  };
  return new MediaService(prisma as never);
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
  let media: MediaService;
  beforeEach(() => {
    media = svc();
  });

  it("приймає справжній PNG", async () => {
    const r = await media.upload(file(PNG, "portrait.png"), "user-1");
    expect(r.kind).toBe("photo");
    expect(r.mimeType).toBe("image/png");
  });

  it("приймає JPEG і PDF", async () => {
    expect((await media.upload(file(JPEG), "u")).mimeType).toBe("image/jpeg");
    expect((await media.upload(file(PDF), "u")).kind).toBe("document");
  });

  it("відхиляє скрипт, замаскований під .jpg", async () => {
    const evil = Buffer.from('<?php system($_GET["c"]); ?>');
    await expect(media.upload(file(evil, "photo.jpg"), "u")).rejects.toThrow(BadRequestException);
  });

  it("відхиляє HTML під виглядом зображення", async () => {
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    await expect(media.upload(file(html, "pic.png"), "u")).rejects.toThrow(BadRequestException);
  });

  it("відхиляє порожній файл", async () => {
    await expect(media.upload(file(Buffer.alloc(0)), "u")).rejects.toThrow(BadRequestException);
  });

  it("відхиляє завеликий файл", async () => {
    const big = { ...file(PNG), size: 999 * 1024 * 1024 };
    await expect(media.upload(big, "u")).rejects.toThrow(BadRequestException);
  });

  it("нове ім'я файлу не залежить від наданого (захист від path traversal)", async () => {
    const r = await media.upload(file(PNG, "../../../etc/passwd.png"), "u");
    expect(r.url).not.toContain("..");
    expect(r.url).toContain(r.id);
  });

  it("статус нового файлу — чернетка (публікація лише після модерації)", async () => {
    const r = await media.upload(file(PNG), "u");
    expect(r.status).toBe("draft");
  });
});
