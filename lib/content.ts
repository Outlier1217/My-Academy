
import type {
  ContentItem,
  ContentStatus,
  ContentType,
  Subject,
} from "@prisma/client";

import { db } from "@/lib/prisma";

export type ContentCardItem = Pick<
  ContentItem,
  | "id"
  | "title"
  | "slug"
  | "type"
  | "subject"
  | "excerpt"
  | "coverImageUrl"
  | "readingMinutes"
  | "durationMinutes"
  | "publishedAt"
  | "featured"
  | "tags"
>;

export type ContentSort = "newest" | "oldest" | "title";

export async function getPublishedContent(
  options: {
    type?: ContentType;
    subject?: Subject;
    take?: number;
    featured?: boolean;
    query?: string;
    sort?: ContentSort;
  } = {},
): Promise<ContentCardItem[]> {
  try {
    const query = options.query?.trim().slice(0, 120);

    const orderBy =
      options.sort === "title"
        ? [{ title: "asc" as const }]
        : options.sort === "oldest"
          ? [
              { publishedAt: "asc" as const },
              { createdAt: "asc" as const },
            ]
          : [
              { featured: "desc" as const },
              { publishedAt: "desc" as const },
              { createdAt: "desc" as const },
            ];

    return await db.contentItem.findMany({
      where: {
        status: "PUBLISHED" satisfies ContentStatus,

        ...(options.type
          ? { type: options.type }
          : {}),

        ...(options.subject
          ? { subject: options.subject }
          : {}),

        ...(options.featured !== undefined
          ? { featured: options.featured }
          : {}),

        ...(query
          ? {
              OR: [
                {
                  title: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
                {
                  excerpt: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
                {
                  body: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },

      orderBy,

      ...(options.take !== undefined
        ? { take: options.take }
        : {}),

      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        subject: true,
        excerpt: true,
        coverImageUrl: true,
        readingMinutes: true,
        durationMinutes: true,
        publishedAt: true,
        featured: true,
        tags: true,
      },
    });
  } catch (error) {
    console.error(
      "Unable to load published content:",
      error instanceof Error ? error.message : error,
    );

    return [];
  }
}

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "content"
  );
}
