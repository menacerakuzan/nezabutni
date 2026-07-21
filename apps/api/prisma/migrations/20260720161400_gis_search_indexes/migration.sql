-- Спеціалізовані індекси, які неможливо описати в Prisma DSL (schema.prisma):
-- GIST для геометрії, GIN + trigram для fuzzy-пошуку, HNSW для векторів.
-- Відповідає docs/db/schema.dbml, розділи place / defender / media_asset / embedding.

-- GIST-індекс для геопросторового пошуку місць (bbox-запити карти)
CREATE INDEX IF NOT EXISTS "place_geom_point_gist_idx"
  ON "place" USING GIST ("geom_point");

-- Trigram GIN-індекс для толерантного до опечаток пошуку імені захисника
CREATE INDEX IF NOT EXISTS "defender_full_name_normalized_trgm_idx"
  ON "defender" USING GIN ("full_name_normalized" gin_trgm_ops);

-- Повнотекстовий пошук по розпізнаному тексту документів архіву
CREATE INDEX IF NOT EXISTS "media_asset_ocr_text_fts_idx"
  ON "media_asset" USING GIN (to_tsvector('simple', coalesce("ocr_text", '')));

-- HNSW-індекс для семантичного пошуку (косинусна відстань) над embedding.vector
CREATE INDEX IF NOT EXISTS "embedding_vector_hnsw_idx"
  ON "embedding" USING hnsw ("vector" vector_cosine_ops);
