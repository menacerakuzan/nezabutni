/**
 * Абстракція сховища бінарних файлів. MediaService працює лише через цей
 * інтерфейс — тому диск і об’єктне сховище (S3/R2/MinIO) взаємозамінні
 * без жодної зміни в бізнес-логіці.
 *
 * `key` — внутрішній ідентифікатор файлу в сховищі (для нас це
 * `${sha256}${розширення}` — детермінований і безпечний від path traversal).
 */
export interface StorageProvider {
  /** Зберегти файл. Повертає нічого — ключ відомий заздалегідь. */
  put(key: string, buffer: Buffer, contentType: string): Promise<void>;

  /** Прочитати файл повністю в память. Кидає, якщо файла немає. */
  get(key: string): Promise<Buffer>;

  /** Видалити файл. Не кидає, якщо файла вже немає (ідемпотентно). */
  remove(key: string): Promise<void>;
}

export class StorageFileNotFoundError extends Error {
  constructor(key: string) {
    super(`Файл не знайдено в сховищі: ${key}`);
    this.name = "StorageFileNotFoundError";
  }
}
