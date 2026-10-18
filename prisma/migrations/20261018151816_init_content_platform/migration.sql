-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'BLOG', 'STORY', 'MOCK_TEST');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('NISM', 'NCFM', 'FINANCE', 'AI_ML', 'BLOCKCHAIN', 'DEFI', 'MATHEMATICS', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "subject" "Subject" NOT NULL DEFAULT 'GENERAL',
    "excerpt" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questions" JSONB NOT NULL DEFAULT '[]',
    "durationMinutes" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "readingMinutes" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_slug_key" ON "ContentItem"("slug");

-- CreateIndex
CREATE INDEX "ContentItem_status_publishedAt_idx" ON "ContentItem"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "ContentItem_type_subject_status_idx" ON "ContentItem"("type", "subject", "status");

-- CreateIndex
CREATE INDEX "ContentItem_featured_publishedAt_idx" ON "ContentItem"("featured", "publishedAt");
