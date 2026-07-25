import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { PrismaService } from "../prisma.service";
import { config } from "../config";
import type { MediaKind } from "@prisma/client";

/**
 * Приймання файлів від родин: перевірка справжнього типу, дедуплікація
 * за контрольною сумою, запис у MediaAsset.
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
    match: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: "image/webp",
    kind: "photo",
    ext: ".webp",
    match: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
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

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  private detect(buffer: Buffer): Signature {
    const sig = SIGNATURES.find((s) => s.match(buffer));
    if (!sig) {
      throw new BadRequestException({
        code: "unsupported_media_type",
        message:
          "Формат файлу не підтримується. Приймаємо JPEG, PNG, WebP, PDF, MP4 та MP3.",
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

    // Ім'я на диску — від контрольної суми: неможливо підмінити шляхом
    // (path traversal через оригінальну назву виключено)
    const filename = `${checksum}${sig.ext}`;
    const dir = join(process.cwd(), config.uploads.dir);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), file.buffer);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        kind: sig.kind,
        title: title?.slice(0, 500) ?? file.originalname.slice(0, 500),
        masterUri: filename,
        storageChecksum: checksum,
        mimeType: sig.mime,
        fileSizeBytes: BigInt(file.size),
        rightsStatement: "Надано родиною для публікації в меморіалі",
        uploadedBy: userId,
        status: "draft", // публікується лише після модерації
      },
    });

    return this.toDto(asset, false);
  }

  /** Віддача файлу за id (перевіряємо статус — чернетки лише завантажувачу). */
  async getFile(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException({ code: "not_found" });
    const path = join(process.cwd(), config.uploads.dir, asset.masterUri);
    try {
      const buffer = await readFile(path);
      return { buffer, mimeType: asset.mimeType ?? "application/octet-stream" };
    } catch {
      throw new NotFoundException({ code: "file_missing" });
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

  private toDto(a: {
    id: string;
    kind: MediaKind;
    title: string | null;
    mimeType: string | null;
    fileSizeBytes: bigint | null;
    status: string;
    createdAt: Date;
  }, deduplicated: boolean) {
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
