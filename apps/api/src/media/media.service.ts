import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma, type ContentStatus, type MediaKind } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { config } from "../config";
import { MEDIA_STORAGE } from "./media.constants";
import type { StorageProvider } from "./storage/storage.interface";
import { StorageFileNotFoundError } from "./storage/storage.interface";

/**
 * Приймання файлів від родин: перевірка справжнього типу, дедуплікація
 * за контрольною сумою, запис у MediaAsset. Байти зберігаються через
 * StorageProvider (диск або S3-сумісне сховище) — сервіс не знає, куди
 * саме вони фізично йдуть.
 *
 * Важливо: тип визначаємо за сигнатурою (magic bytes), а не за заголовком
 * Content-Type чи розширенням — їх підробити тривіально. Файл з .jpg у назві
 * і PHP всередині не потрапить у сховище.
 */

interface Signature {
  mime: string;
  kind: MediaKind;
  ext: string;
  /** Зсув і байти, за якими впізнаємо формат. */
  match: (b: Buffer) => boolean;
}

const SIGNATURES: Signature[] = [
  {
    mime: "image/jpeg",
    kind: "photo",
    ext: ".jpg",
    match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    kind: "photo",
    ext: ".png",
    match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: "image/webp",
    kind: "photo",
    ext: ".webp",
    match: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    mime: "application/pdf",
    kind: "document",
    ext: ".pdf",
    match: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-",
  },
  {
    mime: "video/mp4",
    kind: "video",
    ext: ".mp4",
    match: (b) => b.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    mime: "audio/mpeg",
    kind: "audio",
    ext: ".mp3",
    match: (b) =>
      (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
  },
];

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AdminMediaQuery {
  kind?: MediaKind;
  status?: ContentStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: StorageProvider
  ) {}

  private detect(buffer: Buffer): Signature {
    const sig = SIGNATURES.find((s) => s.match(buffer));
    if (!sig) {
      throw new BadRequestException({
        code: "unsupported_media_type",
        message: "Формат файлу не підтримується. Приймаємо JPEG, PNG, WebP, PDF, MP4 та MP3.",
      });
    }
    return sig;
  }

  async upload(file: UploadedFile, userId: string, title?: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException({ code: "empty_file", message: "Порожній файл." });
    }
    if (file.size > config.uploads.maxBytes) {
      const mb = Math.round(config.uploads.maxBytes / 1024 / 1024);
      throw new BadRequestException({
        code: "file_too_large",
        message: `Файл завеликий. Максимум ${mb} МБ.`,
      });
    }

    const sig = this.detect(file.buffer);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");

    // Дедуплікація: той самий файл не зберігаємо двічі
    const existing = await this.prisma.mediaAsset.findFirst({
      where: { storageChecksum: checksum },
    });
    if (existing) {
      return this.toDto(existing, true);
    }

    // Ключ у сховищі — від контрольної суми: неможливо підмінити шляхом
    // (path traversal через оригінальну назву виключено)
    const key = `${checksum}${sig.ext}`;
    await this.storage.put(key, file.buffer, sig.mime);

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          kind: sig.kind,
          title: title?.slice(0, 500) ?? file.originalname.slice(0, 500),
          masterUri: key,
          storageChecksum: checksum,
          mimeType: sig.mime,
          fileSizeBytes: BigInt(file.size),
          rightsStatement: "Надано родиною для публікації в меморіалі",
          uploadedBy: userId,
          status: "draft", // публікується лише після модерації
        },
      });
      return this.toDto(asset, false);
    } catch (err) {
      // Гонитва: два одночасних завантаження того самого файлу.
      // Унікальний індекс на storageChecksum ловить це на рівні БД —
      // повертаємо вже створений запис замість падіння з 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const race = await this.prisma.mediaAsset.findFirst({ where: { storageChecksum: checksum } });
        if (race) return this.toDto(race, true);
      }
      throw err;
    }
  }

  /** Віддача файлу за id. */
  async getFile(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException({ code: "not_found" });
    try {
      const buffer = await this.storage.get(asset.masterUri);
      return { buffer, mimeType: asset.mimeType ?? "application/octet-stream" };
    } catch (err) {
      if (err instanceof StorageFileNotFoundError) {
        throw new NotFoundException({ code: "file_missing" });
      }
      throw err;
    }
  }

  async listMine(userId: string) {
    const items = await this.prisma.mediaAsset.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return items.map((a) => this.toDto(a, false));
  }

  // ── Адмінська медіатека ──

  async adminList(query: AdminMediaQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 24));

    const where: Prisma.MediaAssetWhereInput = {
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? { title: { contains: query.q, mode: Prisma.QueryMode.insensitive } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { uploadedByUser: { select: { displayName: true, email: true } } },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return {
      items: items.map((a) => ({
        ...this.toDto(a, false),
        uploadedBy: a.uploadedByUser
          ? { displayName: a.uploadedByUser.displayName, email: a.uploadedByUser.email }
          : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async setStatus(id: string, status: ContentStatus) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException({ code: "not_found" });
    const updated = await this.prisma.mediaAsset.update({ where: { id }, data: { status } });
    return this.toDto(updated, false);
  }

  async remove(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException({ code: "not_found" });

    try {
      await this.prisma.mediaAsset.delete({ where: { id } });
    } catch (err) {
      // Файл використовується як портрет/обкладинка/джерело тощо —
      // FK-обмеження (RESTRICT) не дає видалити, поки він десь підключений.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new BadRequestException({
          code: "media_in_use",
          message: "Файл використовується (портрет, обкладинка чи джерело) — спершу відв’яжіть його.",
        });
      }
      throw err;
    }

    await this.storage.remove(asset.masterUri);
    return { ok: true };
  }

  private toDto(
    a: {
      id: string;
      kind: MediaKind;
      title: string | null;
      mimeType: string | null;
      fileSizeBytes: bigint | null;
      status: string;
      createdAt: Date;
    },
    deduplicated: boolean
  ) {
    return {
      id: a.id,
      kind: a.kind,
      title: a.title,
      mimeType: a.mimeType,
      sizeBytes: a.fileSizeBytes ? Number(a.fileSizeBytes) : null,
      status: a.status,
      url: `${config.uploads.publicBaseUrl}/${a.id}`,
      createdAt: a.createdAt,
      deduplicated,
    };
  }
}
