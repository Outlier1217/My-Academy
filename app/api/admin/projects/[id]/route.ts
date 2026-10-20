
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

const fields = [
  "title",
  "slug",
  "tagline",
  "summary",
  "description",
  "coverImageUrl",
  "demoUrl",
  "repoUrl",
  "techStack",
  "status",
  "featured",
  "sortOrder",
] as const;

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const existing = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid changes provided." }, { status: 400 });
    }

    // Validate the complete project, including unchanged required fields.
    const merged = { ...existing, ...updates };

    const title = typeof merged.title === "string" ? merged.title.trim() : "";
    const slug = typeof merged.slug === "string" ? merged.slug.trim().toLowerCase() : "";
    const tagline = typeof merged.tagline === "string" ? merged.tagline.trim() : "";
    const summary = typeof merged.summary === "string" ? merged.summary.trim() : "";
    const description = typeof merged.description === "string" ? merged.description.trim() : "";
    const coverImageUrl = typeof merged.coverImageUrl === "string" ? merged.coverImageUrl.trim() : "";
    const status = merged.status;
    const featured = merged.featured;
    const sortOrder = merged.sortOrder;
    const techStack = merged.techStack;
    const demoUrl = typeof merged.demoUrl === "string" ? merged.demoUrl.trim() : "";
    const repoUrl = typeof merged.repoUrl === "string" ? merged.repoUrl.trim() : "";

    const validUrl = (value: string) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    };

    const validCover =
      /^https?:\/\/\S+$/i.test(coverImageUrl) ||
      /^\/uploads\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/i.test(coverImageUrl);

    if (!title || title.length > 150 ||
        !slug || slug.length > 180 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
        !tagline || tagline.length > 300 ||
        !summary || summary.length > 1000 ||
        !description || description.length > 30000 ||
        !coverImageUrl || coverImageUrl.length > 2048 || !validCover ||
        (demoUrl && (demoUrl.length > 2048 || !validUrl(demoUrl))) ||
        (repoUrl && (repoUrl.length > 2048 || !validUrl(repoUrl))) ||
        !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status as string) ||
        typeof featured !== "boolean" ||
        !Number.isInteger(sortOrder) ||
        (sortOrder as number) < 0 ||
        (sortOrder as number) > 100000 ||
        !Array.isArray(techStack) ||
        techStack.length > 30 ||
        !techStack.every((item) =>
          typeof item === "string" && item.trim().length > 0 && item.trim().length <= 60
        )
    ) {
      return NextResponse.json({ error: "Invalid project data." }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      ...updates,
      title,
      slug,
      tagline,
      summary,
      description,
      coverImageUrl,
      demoUrl: demoUrl || null,
      repoUrl: repoUrl || null,
      techStack: Array.from(
  new Set((techStack as string[]).map((item) => item.trim()))
),
      status,
      featured,
      sortOrder,
    };

    // Set publishedAt when first publishing; clear it when unpublishing.
    if (updates.status !== undefined) {
      data.publishedAt =
        status === "PUBLISHED"
          ? existing.publishedAt ?? new Date()
          : null;
    }

    const project = await db.project.update({
      where: { id: params.id },
      data: data as never,
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This project slug already exists." },
        { status: 409 }
      );
    }

    console.error("Update project failed:", error);
    return NextResponse.json(
      { error: "Unable to update project." },
      { status: 503 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await db.project.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project failed:", error);
    return NextResponse.json(
      { error: "Unable to delete project. It may no longer exist." },
      { status: 404 }
    );
  }
}
