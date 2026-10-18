import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { contentSchema } from "@/lib/content-validation";
import { slugify } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await db.contentItem.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Admin content load failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Database unavailable. Check DATABASE_URL and run migrations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = contentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid content." }, { status: 400 });
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  try {
    const item = await db.contentItem.create({
      data: {
        title: data.title, slug, type: data.type, subject: data.subject,
        excerpt: data.excerpt, body: data.body, coverImageUrl: data.coverImageUrl || null,
        tags: data.tags, questions: data.questions, status: data.status,
        featured: data.featured, readingMinutes: data.readingMinutes ?? null,
        durationMinutes: data.durationMinutes ?? null,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("P2002")) return NextResponse.json({ error: "This slug is already in use. Choose another slug." }, { status: 409 });
    console.error("Create content failed:", message);
    return NextResponse.json({ error: "Could not save content. Check the database connection." }, { status: 503 });
  }
}
