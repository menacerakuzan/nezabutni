-- DropIndex
DROP INDEX "defender_full_name_normalized_trgm_idx";

-- DropIndex
DROP INDEX "place_geom_point_gist_idx";

-- CreateTable
CREATE TABLE "menu_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(120) NOT NULL,
    "href" VARCHAR(255) NOT NULL,
    "location" VARCHAR(40) NOT NULL,
    "parent_id" UUID,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_block" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page" VARCHAR(60) NOT NULL,
    "block_type" VARCHAR(80) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "props" JSONB,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_item_location_sort_order_idx" ON "menu_item"("location", "sort_order");

-- CreateIndex
CREATE INDEX "page_block_page_sort_order_idx" ON "page_block"("page", "sort_order");

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
