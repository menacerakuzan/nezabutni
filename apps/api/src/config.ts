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
    /** Локальна тека або S3 — визначається наявністю S3_BUCKET. */
    dir: process.env.UPLOAD_DIR ?? "uploads",
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 15 * 1024 * 1024),
    publicBaseUrl: process.env.UPLOAD_PUBLIC_BASE_URL ?? "/api/v1/media/file",
  },
} as const;
