import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { contentSchema } from "@/lib/content-validation";
import { slugify } from "@/lib/content";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = contentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid content." }, { status: 400 });
  const data = parsed.data;
  try {
    const existing = await db.contentItem.findUnique({ where: { id: context.params.id } });
    if (!existing) return NextResponse.json({ error: "Content not found." }, { status: 404 });
    const slug = slugify(data.slug || data.title);
    const item = await db.contentItem.update({
      where: { id: context.params.id },
      data: {
        title: data.title, slug, type: data.type, subject: data.subject,
        excerpt: data.excerpt, body: data.body, coverImageUrl: data.coverImageUrl || null,
        youtubeUrl: data.youtubeUrl || null,
        tags: data.tags, questions: data.questions, status: data.status,
        featured: data.featured, readingMinutes: data.readingMinutes ?? null,
        durationMinutes: data.durationMinutes ?? null,
        publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : null,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("P2002")) return NextResponse.json({ error: "This slug is already in use. Choose another slug." }, { status: 409 });
    console.error("Update content failed:", message);
    return NextResponse.json({ error: "Could not update content." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await db.contentItem.delete({ where: { id: context.params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete content failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not delete content." }, { status: 503 });
  }
}
