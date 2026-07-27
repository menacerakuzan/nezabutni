-- DropIndex
DROP INDEX "defender_full_name_normalized_trgm_idx";

-- DropIndex
DROP INDEX "place_geom_point_gist_idx";

-- CreateTable
CREATE TABLE "news_post" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "excerpt" VARCHAR(400),
    "body" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "author_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_setting" (
    "key" VARCHAR(80) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_post_slug_key" ON "news_post"("slug");

-- CreateIndex
CREATE INDEX "news_post_status_published_at_idx" ON "news_post"("status", "published_at");

-- AddForeignKey
ALTER TABLE "news_post" ADD CONSTRAINT "news_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
