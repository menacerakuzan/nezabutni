import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { StorageProvider } from "./storage.interface";
import { StorageFileNotFoundError } from "./storage.interface";

/**
 * Локальний диск. Годиться для розробки, і для продакшну — якщо тека
 * змонтована як постійний том (інакше файли зникають при кожному деплої).
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  private path(key: string): string {
    return join(this.baseDir, key);
  }

  async put(key: string, buffer: Buffer): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(this.path(key), buffer);
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await readFile(this.path(key));
    } catch {
      throw new StorageFileNotFoundError(key);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.path(key));
    } catch {
      // ідемпотентно: файла й так немає — це не помилка виклику
    }
  }
}
