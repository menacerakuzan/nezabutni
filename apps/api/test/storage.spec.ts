import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorageProvider } from "../src/media/storage/local-storage.provider";
import { StorageFileNotFoundError } from "../src/media/storage/storage.interface";

describe("LocalStorageProvider", () => {
  let dir: string;
  let storage: LocalStorageProvider;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "media-test-"));
    storage = new LocalStorageProvider(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("зберігає й повертає той самий вміст", async () => {
    const data = Buffer.from("вміст файлу");
    await storage.put("abc.png", data, "image/png");
    const back = await storage.get("abc.png");
    expect(back.equals(data)).toBe(true);
  });

  it("створює теку, якщо її ще немає", async () => {
    const nested = new LocalStorageProvider(join(dir, "nested", "deeper"));
    await nested.put("x.png", Buffer.from("1"), "image/png");
    expect((await nested.get("x.png")).toString()).toBe("1");
  });

  it("кидає StorageFileNotFoundError для відсутнього файлу", async () => {
    await expect(storage.get("немає-такого.png")).rejects.toThrow(StorageFileNotFoundError);
  });

  it("remove ідемпотентний — не кидає, якщо файла й так немає", async () => {
    await expect(storage.remove("привид.png")).resolves.toBeUndefined();
  });

  it("remove справді прибирає файл", async () => {
    await storage.put("temp.png", Buffer.from("дані"), "image/png");
    await storage.remove("temp.png");
    await expect(storage.get("temp.png")).rejects.toThrow(StorageFileNotFoundError);
  });
});

// ── S3-сумісне сховище: мокаємо AWS SDK, щоб не ходити в мережу.
// Перевіряємо контракт — які команди й з якими параметрами відправляються.
const sendMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class FakeCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class FakeS3Client {
    // Конструктор ігнорує опції — тест перевіряє лише команди, що йдуть у send()
    send(...args: unknown[]) {
      return sendMock(...args);
    }
  }
  return {
    S3Client: FakeS3Client,
    PutObjectCommand: class extends FakeCommand {
      readonly _tag = "Put";
    },
    GetObjectCommand: class extends FakeCommand {
      readonly _tag = "Get";
    },
    DeleteObjectCommand: class extends FakeCommand {
      readonly _tag = "Delete";
    },
  };
});

describe("S3StorageProvider", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  async function provider() {
    const { S3StorageProvider } = await import("../src/media/storage/s3-storage.provider");
    return new S3StorageProvider({
      bucket: "nezabutni-media",
      region: "auto",
      endpoint: "https://example.r2.cloudflarestorage.com",
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      forcePathStyle: true,
    });
  }

  it("put відправляє PutObjectCommand з правильними Bucket/Key/ContentType", async () => {
    sendMock.mockResolvedValueOnce({});
    const s3 = await provider();
    await s3.put("abc.png", Buffer.from("дані"), "image/png");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0]![0];
    expect(cmd.input.Bucket).toBe("nezabutni-media");
    expect(cmd.input.Key).toBe("abc.png");
    expect(cmd.input.ContentType).toBe("image/png");
  });

  it("get читає потік і повертає Buffer з тим самим вмістом", async () => {
    const { Readable } = await import("node:stream");
    const body = Readable.from([Buffer.from("прив"), Buffer.from("іт")]);
    sendMock.mockResolvedValueOnce({ Body: body });

    const s3 = await provider();
    const result = await s3.get("abc.png");
    expect(result.toString()).toBe("привіт");
  });

  it("get кидає StorageFileNotFoundError на NoSuchKey", async () => {
    const err = new Error("not found");
    err.name = "NoSuchKey";
    sendMock.mockRejectedValueOnce(err);

    const s3 = await provider();
    await expect(s3.get("нема.png")).rejects.toThrow(StorageFileNotFoundError);
  });

  it("remove відправляє DeleteObjectCommand з ключем файлу", async () => {
    sendMock.mockResolvedValueOnce({});
    const s3 = await provider();
    await s3.remove("abc.png");

    const cmd = sendMock.mock.calls[0]![0];
    expect(cmd.input.Key).toBe("abc.png");
  });
});
