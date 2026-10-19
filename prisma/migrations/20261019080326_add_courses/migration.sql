-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'COURSE';

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "youtubeUrl" VARCHAR(2048);
