
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectInput = {
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  description: string;
  coverImageUrl: string;
  demoUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  sortOrder: number;
};

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseProject(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const tagline = typeof body.tagline === "string" ? body.tagline.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const coverImageUrl =
    typeof body.coverImageUrl === "string" ? body.coverImageUrl.trim() : "";
  const demoUrl =
    typeof body.demoUrl === "string" ? body.demoUrl.trim() : "";
  const repoUrl =
    typeof body.repoUrl === "string" ? body.repoUrl.trim() : "";
  const techStack = body.techStack;
  const status = body.status ?? "DRAFT";
  const featured = body.featured ?? false;
  const sortOrder = body.sortOrder ?? 0;

  if (!title || title.length > 150) {
    return { error: "Title must be 1–150 characters." };
  }

  if (
    !slug ||
    slug.length > 180 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    return { error: "Enter a valid URL slug using lowercase letters, numbers and hyphens." };
  }

  if (!tagline || tagline.length > 300) {
    return { error: "Tagline must be 1–300 characters." };
  }

  if (!summary || summary.length > 1000) {
    return { error: "Summary must be 1–1000 characters." };
  }

  if (!description || description.length > 30000) {
    return { error: "Description must be 1–30000 characters." };
  }

  const validCover =
    /^https?:\/\/\S+$/i.test(coverImageUrl) ||
    /^\/uploads\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/i.test(coverImageUrl);

  if (!coverImageUrl || coverImageUrl.length > 2048 || !validCover) {
    return { error: "Provide a valid HTTP, HTTPS or uploaded cover image URL." };
  }

  if (
    (demoUrl && (demoUrl.length > 2048 || !validUrl(demoUrl))) ||
    (repoUrl && (repoUrl.length > 2048 || !validUrl(repoUrl)))
  ) {
    return { error: "Demo and repository links must be valid HTTP or HTTPS URLs." };
  }

  if (
    !Array.isArray(techStack) ||
    techStack.length > 30 ||
    !techStack.every(
      (item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 60
    )
  ) {
    return { error: "Tech stack must contain up to 30 valid technology names." };
  }

  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status as string)) {
    return { error: "Invalid project status." };
  }

  if (typeof featured !== "boolean") {
    return { error: "Invalid featured value." };
  }

  if (
    !Number.isInteger(sortOrder) ||
    (sortOrder as number) < 0 ||
    (sortOrder as number) > 100000
  ) {
    return { error: "Sort order must be between 0 and 100000." };
  }

  return {
    data: {
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
      status: status as ProjectInput["status"],
      featured,
      sortOrder: sortOrder as number,
    } satisfies Omit<ProjectInput, never>,
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const projects = await db.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Admin projects load failed:", error);
    return NextResponse.json(
      { error: "Unable to load projects." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = parseProject(body as Record<string, unknown>);

    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        ...parsed.data,
        publishedAt:
          parsed.data.status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This project slug already exists. Choose another slug." },
        { status: 409 }
      );
    }

    console.error("Create project failed:", error);
    return NextResponse.json(
      { error: "Unable to create project." },
      { status: 503 }
    );
  }
}
