import type { StorageProvider } from "./storage.interface";
import { LocalStorageProvider } from "./local-storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";
import { config } from "../../config";

/**
 * Обирає сховище за конфігом. Перемикання диск ↔ S3/R2 — це зміна
 * змінних оточення, без правок коду й без міграції даних (нові файли
 * просто підуть в інше сховище; старі лишаються доступними, поки не
 * перенесені).
 */
export function createStorageProvider(): StorageProvider {
  if (config.uploads.driver === "s3") {
    const s3 = config.uploads.s3;
    if (!s3) {
      throw new Error(
        "UPLOAD_DRIVER=s3, але S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY не задані."
      );
    }
    return new S3StorageProvider(s3);
  }
  return new LocalStorageProvider(config.uploads.localDir);
}
