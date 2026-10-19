-- CreateTable
CREATE TABLE "CandidateTestimonial" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "imageUrl" VARCHAR(2048) NOT NULL,
    "about" VARCHAR(1000) NOT NULL,
    "message" VARCHAR(3000) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateTestimonial_isPublished_sortOrder_idx" ON "CandidateTestimonial"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidateTestimonial_createdAt_idx" ON "CandidateTestimonial"("createdAt");
