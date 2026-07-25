-- Попередня міграція (cms_menu_and_page_blocks) була згенерована через
-- `prisma migrate dev`, який порівнює фактичну БД зі schema.prisma. Він не
-- бачить індекси, створені сирим SQL (GIST/trigram — Prisma DSL їх не
-- підтримує), і прибрав їх як "дрейф". Відновлюємо назавжди, ідемпотентно.

CREATE INDEX IF NOT EXISTS "place_geom_point_gist_idx"
  ON "place" USING GIST ("geom_point");

CREATE INDEX IF NOT EXISTS "defender_full_name_normalized_trgm_idx"
  ON "defender" USING GIN ("full_name_normalized" gin_trgm_ops);
