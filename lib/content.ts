import type { ContentItem, ContentStatus, ContentType, Subject } from "@prisma/client";
import { db } from "@/lib/prisma";

export type ContentCardItem = Pick<ContentItem,
  "id" | "title" | "slug" | "type" | "subject" | "excerpt" | "coverImageUrl" |
  "readingMinutes" | "durationMinutes" | "publishedAt" | "featured" | "tags"
>;

export async function getPublishedContent(options: {
  type?: ContentType;
  subject?: Subject;
  take?: number;
  featured?: boolean;
} = {}): Promise<ContentCardItem[]> {
  try {
    return await db.contentItem.findMany({
      where: {
        status: "PUBLISHED" satisfies ContentStatus,
        ...(options.type ? { type: options.type } : {}),
        ...(options.subject ? { subject: options.subject } : {}),
        ...(options.featured !== undefined ? { featured: options.featured } : {}),
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: options.take ?? 24,
      select: {
        id: true, title: true, slug: true, type: true, subject: true, excerpt: true,
        coverImageUrl: true, readingMinutes: true, durationMinutes: true,
        publishedAt: true, featured: true, tags: true,
      },
    });
  } catch (error) {
    // Keep the marketing homepage usable before a database has been configured.
    console.error("Unable to load published content:", error instanceof Error ? error.message : error);
    return [];
  }
}

export function slugify(input: string) {
  return input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "content";
}
