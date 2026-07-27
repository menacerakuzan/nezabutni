import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import type { StorageProvider } from "./storage.interface";
import { StorageFileNotFoundError } from "./storage.interface";

export interface S3StorageOptions {
  bucket: string;
  region: string;
  /** Власний endpoint для R2/MinIO. Для AWS S3 лишити порожнім. */
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** MinIO та деякі S3-сумісні сховища вимагають path-style URL. */
  forcePathStyle?: boolean;
}

/**
 * Об’єктне сховище через AWS SDK v3 — сумісне з AWS S3, Cloudflare R2,
 * MinIO та іншими S3-сумісними бекендами (досить лише вказати endpoint).
 * Файли переживають будь-який редеплой API, бо живуть поза контейнером.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(opts: S3StorageOptions) {
    this.bucket = opts.bucket;
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: opts.forcePathStyle,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Файли незмінні (ім'я — хеш вмісту), тож кешуємо надовго
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  }

  async get(key: string): Promise<Buffer> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return await streamToBuffer(res.Body as Readable);
    } catch (err) {
      const code = (err as { name?: string })?.name;
      if (code === "NoSuchKey" || code === "NotFound") {
        throw new StorageFileNotFoundError(key);
      }
      throw err;
    }
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
