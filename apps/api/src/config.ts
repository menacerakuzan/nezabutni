/**
 * Централізована конфігурація з перевіркою на старті.
 *
 * Принцип: у продакшні сервіс НЕ стартує без явно заданих секретів.
 * Мовчазний фолбэк на дефолтний JWT-секрет означав би, що будь-хто
 * може підробити токен адміністратора меморіалу.
 */

const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value && value.trim().length > 0) return value;
  if (!isProd && devFallback) return devFallback;
  throw new Error(
    `Змінна оточення ${name} обов'язкова у production. Сервіс зупинено, щоб не працювати з небезпечними значеннями.`
  );
}

/** JWT-секрет: у dev дозволяємо явно позначений небезпечний дефолт. */
const jwtSecret = required("JWT_SECRET", "dev-only-insecure-secret");

if (isProd && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET у production має бути щонайменше 32 символи.");
}

/**
 * Дозволені джерела для CORS. У проді — лише явний список,
 * жодного `origin: true`, який відбиває будь-який домен.
 */
const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 3001),
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  },
  cors: {
    origins: corsOrigins.length
      ? corsOrigins
      : isProd
        ? []
        : ["http://localhost:3000", "http://localhost:3211", "http://127.0.0.1:3211"],
  },
  uploads: {
    /**
     * "local" — диск (для проду потрібен постійний том, інакше файли
     * зникають при редеплої); "s3" — об'єктне сховище (AWS S3 / Cloudflare
     * R2 / MinIO). Перемикається змінною UPLOAD_DRIVER, без правок коду.
     */
    driver: (process.env.UPLOAD_DRIVER === "s3" ? "s3" : "local") as "local" | "s3",
    localDir: process.env.UPLOAD_DIR ?? "uploads",
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 15 * 1024 * 1024),
    publicBaseUrl: process.env.UPLOAD_PUBLIC_BASE_URL ?? "/api/v1/media/file",
    s3:
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
        ? {
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION ?? "auto",
            endpoint: process.env.S3_ENDPOINT,
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
          }
        : undefined,
  },
} as const;

if (isProd && config.uploads.driver === "local") {
  // Не фатально — власник сервісу міг свідомо підключити постійний том
  // до UPLOAD_DIR (наприклад Railway Volume). Але це варто помітити в логах,
  // бо найчастіша причина "файли зникли після деплою" — саме забутий том.
  // eslint-disable-next-line no-console
  console.warn(
    "[config] UPLOAD_DRIVER=local у production: переконайтесь, що UPLOAD_DIR змонтовано як постійний том."
  );
}
