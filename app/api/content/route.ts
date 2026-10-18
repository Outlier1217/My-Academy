import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const TYPES = ["ARTICLE", "BLOG", "STORY", "MOCK_TEST"] as const;
const SUBJECTS = ["NISM", "NCFM", "FINANCE", "AI_ML", "BLOCKCHAIN", "DEFI", "MATHEMATICS", "GENERAL"] as const;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawType = params.get("type")?.toUpperCase();
  const rawSubject = params.get("subject")?.toUpperCase();
  const query = params.get("q")?.trim().slice(0, 100);
  const type = TYPES.find((item) => item === rawType);
  const subject = SUBJECTS.find((item) => item === rawSubject);
  try {
    const items = await db.contentItem.findMany({
      where: {
        status: "PUBLISHED",
        ...(type ? { type } : {}),
        ...(subject ? { subject } : {}),
        ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { excerpt: { contains: query, mode: "insensitive" } }, { tags: { has: query } }] } : {}),
      },
      select: { id: true, title: true, slug: true, type: true, subject: true, excerpt: true, coverImageUrl: true, tags: true, featured: true, readingMinutes: true, durationMinutes: true, publishedAt: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 60,
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Public content load failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Content is temporarily unavailable." }, { status: 503 });
  }
}
