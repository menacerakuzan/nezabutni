-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('draft', 'pending', 'verified', 'disputed', 'archived');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "place_type" AS ENUM ('battle', 'memorial', 'burial', 'monument', 'museum_site', 'frontline_segment');

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('photo', 'video', 'audio', 'document', 'document_3d', 'panorama');

-- CreateEnum
CREATE TYPE "moderation_status" AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- CreateTable
CREATE TABLE "app_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(20),
    "display_name" VARCHAR(255) NOT NULL,
    "avatar_media_id" UUID,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'uk',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" INTEGER NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_uk" VARCHAR(120) NOT NULL,
    "description" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,
    "scope_type" VARCHAR(30),
    "scope_id" UUID,
    "granted_by" UUID,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "key_hash" VARCHAR(128) NOT NULL,
    "label" VARCHAR(120),
    "rate_limit_per_min" INTEGER NOT NULL DEFAULT 60,
    "scopes" VARCHAR(255),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "koatuu_code" VARCHAR(20),
    "parent_id" UUID,
    "level" SMALLINT NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "place_type" NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,
    "geom_point" geography(Point,4326),
    "geom_area" geography(Polygon,4326),
    "region_id" UUID,
    "date_from" DATE,
    "date_to" DATE,
    "sensitivity_level" SMALLINT NOT NULL DEFAULT 0,
    "cover_media_id" UUID,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_route" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,
    "geom_line" geography(LineString,4326),
    "curator_id" UUID,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_route_place" (
    "route_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "seq_order" SMALLINT NOT NULL,

    CONSTRAINT "memory_route_place_pkey" PRIMARY KEY ("route_id","place_id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID,
    "name" VARCHAR(500) NOT NULL,
    "official_number" VARCHAR(50),
    "type" VARCHAR(100),
    "branch" VARCHAR(100),
    "insignia_media_id" UUID,
    "description" TEXT,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defender" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pid" VARCHAR(30) NOT NULL,
    "full_name" VARCHAR(500) NOT NULL,
    "full_name_normalized" VARCHAR(500) NOT NULL,
    "callsign" VARCHAR(120),
    "gender" VARCHAR(10),
    "birth_date" DATE,
    "birth_place_id" UUID,
    "death_date" DATE,
    "death_place_id" UUID,
    "burial_place_id" UUID,
    "unit_id" UUID,
    "rank" VARCHAR(120),
    "bio" TEXT,
    "bio_blocks" JSONB,
    "portrait_media_id" UUID,
    "region_id" UUID,
    "verification_status" "verification_status" NOT NULL DEFAULT 'pending',
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "guardian_user_id" UUID,
    "candle_count" INTEGER NOT NULL DEFAULT 0,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defender_award" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "defender_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "awarded_date" DATE,
    "decree_reference" VARCHAR(255),
    "source_id" UUID,

    CONSTRAINT "defender_award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defender_place_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "defender_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "date_from" DATE,
    "date_to" DATE,

    CONSTRAINT "defender_place_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defender_relation" (
    "defender_id" UUID NOT NULL,
    "related_defender_id" UUID NOT NULL,
    "relation_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "defender_relation_pkey" PRIMARY KEY ("defender_id","related_defender_id","relation_type")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "media_kind" NOT NULL,
    "title" VARCHAR(500),
    "description" TEXT,
    "master_uri" VARCHAR(1000) NOT NULL,
    "storage_checksum" VARCHAR(128) NOT NULL,
    "mime_type" VARCHAR(120),
    "file_size_bytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" DECIMAL(10,2),
    "exif" JSONB,
    "ocr_text" TEXT,
    "ocr_lang" VARCHAR(10),
    "iiif_manifest_uri" VARCHAR(1000),
    "rights_statement" VARCHAR(255) NOT NULL,
    "provenance" TEXT,
    "ai_generated_caption" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" UUID,
    "partner_id" UUID,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_derivative" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_id" UUID NOT NULL,
    "type" VARCHAR(50),
    "uri" VARCHAR(1000) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "media_derivative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_link" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_id" UUID NOT NULL,
    "entity_type" VARCHAR(30) NOT NULL,
    "entity_id" UUID NOT NULL,
    "role" VARCHAR(50),
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "media_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_id" UUID,
    "citation" TEXT NOT NULL,
    "provenance" TEXT,
    "reliability" SMALLINT,
    "external_url" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_fixity_check" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_id" UUID NOT NULL,
    "checksum_verified" VARCHAR(128) NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_fixity_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(500) NOT NULL,
    "type" VARCHAR(50),
    "contact_email" VARCHAR(320),
    "logo_media_id" UUID,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',

    CONSTRAINT "partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "partner_id" UUID,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_media" (
    "collection_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,

    CONSTRAINT "collection_media_pkey" PRIMARY KEY ("collection_id","media_id")
);

-- CreateTable
CREATE TABLE "exhibit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "collection_id" UUID,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255),
    "summary" TEXT,
    "model_uri" VARCHAR(1000),
    "panorama_uri" VARCHAR(1000),
    "blocks" JSONB NOT NULL,
    "curator_id" UUID,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exhibit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibit_defender" (
    "exhibit_id" UUID NOT NULL,
    "defender_id" UUID NOT NULL,

    CONSTRAINT "exhibit_defender_pkey" PRIMARY KEY ("exhibit_id","defender_id")
);

-- CreateTable
CREATE TABLE "story" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "blocks" JSONB NOT NULL,
    "timeline" JSONB,
    "cover_media_id" UUID,
    "author_id" UUID,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_defender" (
    "story_id" UUID NOT NULL,
    "defender_id" UUID NOT NULL,

    CONSTRAINT "story_defender_pkey" PRIMARY KEY ("story_id","defender_id")
);

-- CreateTable
CREATE TABLE "memory_ugc" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "defender_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "media_id" UUID,
    "status" "moderation_status" NOT NULL DEFAULT 'pending',
    "moderated_by" UUID,
    "moderated_at" TIMESTAMP(3),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_ugc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candle_lit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "defender_id" UUID NOT NULL,
    "user_id" UUID,
    "session_fingerprint" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candle_lit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defender_submission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submitted_by" UUID NOT NULL,
    "defender_id" UUID,
    "payload" JSONB NOT NULL,
    "attached_media_ids" UUID[],
    "status" "moderation_status" NOT NULL DEFAULT 'pending',
    "assigned_verifier_id" UUID,
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "defender_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(30) NOT NULL,
    "entity_id" UUID NOT NULL,
    "editor_id" UUID,
    "diff" JSONB NOT NULL,
    "full_snapshot" JSONB,
    "comment" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(30),
    "entity_id" UUID,
    "diff" JSONB,
    "ip_address" TEXT,
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_record" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "defender_id" UUID,
    "consent_type" VARCHAR(50) NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "document_media_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_auth_subject_key" ON "app_user"("auth_subject");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE INDEX "app_user_email_idx" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_code_key" ON "role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_role_id_scope_type_scope_id_key" ON "user_role"("user_id", "role_id", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_key_hash_key" ON "api_key"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "place_slug_key" ON "place"("slug");

-- CreateIndex
CREATE INDEX "place_type_idx" ON "place"("type");

-- CreateIndex
CREATE INDEX "place_region_id_idx" ON "place"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_route_slug_key" ON "memory_route"("slug");

-- CreateIndex
CREATE INDEX "unit_parent_id_idx" ON "unit"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "defender_pid_key" ON "defender"("pid");

-- CreateIndex
CREATE INDEX "defender_unit_id_idx" ON "defender"("unit_id");

-- CreateIndex
CREATE INDEX "defender_verification_status_idx" ON "defender"("verification_status");

-- CreateIndex
CREATE INDEX "defender_region_id_idx" ON "defender"("region_id");

-- CreateIndex
CREATE INDEX "defender_death_date_idx" ON "defender"("death_date");

-- CreateIndex
CREATE INDEX "defender_place_role_defender_id_place_id_role_idx" ON "defender_place_role"("defender_id", "place_id", "role");

-- CreateIndex
CREATE INDEX "media_asset_kind_idx" ON "media_asset"("kind");

-- CreateIndex
CREATE INDEX "media_asset_status_idx" ON "media_asset"("status");

-- CreateIndex
CREATE INDEX "media_derivative_media_id_idx" ON "media_derivative"("media_id");

-- CreateIndex
CREATE INDEX "media_link_entity_type_entity_id_idx" ON "media_link"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_slug_key" ON "collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exhibit_slug_key" ON "exhibit"("slug");

-- CreateIndex
CREATE INDEX "exhibit_collection_id_idx" ON "exhibit"("collection_id");

-- CreateIndex
CREATE INDEX "exhibit_status_idx" ON "exhibit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "story_slug_key" ON "story"("slug");

-- CreateIndex
CREATE INDEX "story_status_idx" ON "story"("status");

-- CreateIndex
CREATE INDEX "memory_ugc_defender_id_idx" ON "memory_ugc"("defender_id");

-- CreateIndex
CREATE INDEX "memory_ugc_status_idx" ON "memory_ugc"("status");

-- CreateIndex
CREATE INDEX "candle_lit_defender_id_user_id_created_at_idx" ON "candle_lit"("defender_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "candle_lit_defender_id_session_fingerprint_created_at_idx" ON "candle_lit"("defender_id", "session_fingerprint", "created_at");

-- CreateIndex
CREATE INDEX "defender_submission_status_idx" ON "defender_submission"("status");

-- CreateIndex
CREATE INDEX "defender_submission_submitted_by_idx" ON "defender_submission"("submitted_by");

-- CreateIndex
CREATE INDEX "content_revision_entity_type_entity_id_created_at_idx" ON "content_revision"("entity_type", "entity_id", "created_at");

-- CreateIndex

-- CreateIndex

-- CreateIndex

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "region" ADD CONSTRAINT "region_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place" ADD CONSTRAINT "place_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place" ADD CONSTRAINT "place_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place" ADD CONSTRAINT "place_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_route" ADD CONSTRAINT "memory_route_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_route_place" ADD CONSTRAINT "memory_route_place_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "memory_route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_route_place" ADD CONSTRAINT "memory_route_place_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_insignia_media_id_fkey" FOREIGN KEY ("insignia_media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_birth_place_id_fkey" FOREIGN KEY ("birth_place_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_death_place_id_fkey" FOREIGN KEY ("death_place_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_burial_place_id_fkey" FOREIGN KEY ("burial_place_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_portrait_media_id_fkey" FOREIGN KEY ("portrait_media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_guardian_user_id_fkey" FOREIGN KEY ("guardian_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender" ADD CONSTRAINT "defender_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_award" ADD CONSTRAINT "defender_award_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_award" ADD CONSTRAINT "defender_award_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_place_role" ADD CONSTRAINT "defender_place_role_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_place_role" ADD CONSTRAINT "defender_place_role_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_relation" ADD CONSTRAINT "defender_relation_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_relation" ADD CONSTRAINT "defender_relation_related_defender_id_fkey" FOREIGN KEY ("related_defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_derivative" ADD CONSTRAINT "media_derivative_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source" ADD CONSTRAINT "source_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_fixity_check" ADD CONSTRAINT "media_fixity_check_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_media" ADD CONSTRAINT "collection_media_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_media" ADD CONSTRAINT "collection_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibit" ADD CONSTRAINT "exhibit_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibit" ADD CONSTRAINT "exhibit_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibit_defender" ADD CONSTRAINT "exhibit_defender_exhibit_id_fkey" FOREIGN KEY ("exhibit_id") REFERENCES "exhibit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibit_defender" ADD CONSTRAINT "exhibit_defender_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_defender" ADD CONSTRAINT "story_defender_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_defender" ADD CONSTRAINT "story_defender_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_ugc" ADD CONSTRAINT "memory_ugc_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_ugc" ADD CONSTRAINT "memory_ugc_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_ugc" ADD CONSTRAINT "memory_ugc_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_ugc" ADD CONSTRAINT "memory_ugc_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candle_lit" ADD CONSTRAINT "candle_lit_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candle_lit" ADD CONSTRAINT "candle_lit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_submission" ADD CONSTRAINT "defender_submission_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_submission" ADD CONSTRAINT "defender_submission_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defender_submission" ADD CONSTRAINT "defender_submission_assigned_verifier_id_fkey" FOREIGN KEY ("assigned_verifier_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revision" ADD CONSTRAINT "content_revision_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_defender_id_fkey" FOREIGN KEY ("defender_id") REFERENCES "defender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_document_media_id_fkey" FOREIGN KEY ("document_media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

