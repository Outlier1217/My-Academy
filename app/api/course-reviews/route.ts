
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const reviews = await db.courseReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        content: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({
      reviews: reviews.map(({ email, ...review }) => review),
    });
  } catch (error) {
    console.error("Admin course reviews load failed:", error);
    return NextResponse.json(
      { error: "Unable to load course reviews." },
      { status: 503 }
    );
  }
}
