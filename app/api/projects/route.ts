
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { featured: "desc" },
        { sortOrder: "asc" },
        { publishedAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        tagline: true,
        summary: true,
        coverImageUrl: true,
        techStack: true,
        demoUrl: true,
        repoUrl: true,
        featured: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Public projects load failed:", error);

    return NextResponse.json(
      { error: "Unable to load projects." },
      { status: 503 }
    );
  }
}
