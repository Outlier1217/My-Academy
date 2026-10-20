
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: { slug: string } };

export async function GET(_request: Request, { params }: Context) {
  try {
    const project = await db.project.findFirst({
      where: {
        slug: params.slug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        tagline: true,
        summary: true,
        description: true,
        coverImageUrl: true,
        demoUrl: true,
        repoUrl: true,
        techStack: true,
        featured: true,
        publishedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project detail load failed:", error);

    return NextResponse.json(
      { error: "Unable to load project." },
      { status: 503 }
    );
  }
}
