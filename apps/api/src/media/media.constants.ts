/**
 * DI-токен для StorageProvider. Інтерфейси не мають рантайм-представлення
 * в TypeScript, тому Nest не може вивести токен injection з типу параметра —
 * потрібен явний токен (символ), зареєстрований у MediaModule.
 */
export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");
