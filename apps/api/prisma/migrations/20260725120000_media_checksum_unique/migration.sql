-- Дедуплікація завантажень раніше гарантувалась лише в коді (findFirst
-- перед create), що вразливо до гонитви при одночасних запитах.
-- Унікальний індекс переносить цю гарантію на рівень БД.

CREATE UNIQUE INDEX IF NOT EXISTS "media_asset_storage_checksum_key"
  ON "media_asset" ("storage_checksum");
