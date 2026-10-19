
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data: { name?: string; rating?: number; feedback?: string } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name || name.length > 100) {
        return NextResponse.json({ error: "Name must be 1–100 characters." }, { status: 400 });
      }
      data.name = name;
    }

    if (body.rating !== undefined) {
      if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
      }
      data.rating = body.rating;
    }

    if (typeof body.feedback === "string") {
      const feedback = body.feedback.trim();
      if (!feedback || feedback.length > 3000) {
        return NextResponse.json({ error: "Feedback must be 1–3000 characters." }, { status: 400 });
      }
      data.feedback = feedback;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "No valid changes provided." }, { status: 400 });
    }

    const review = await db.courseReview.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        rating: true,
        feedback: true,
        createdAt: true,
        content: { select: { title: true, slug: true } },
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Admin course review update failed:", error);
    return NextResponse.json(
      { error: "Unable to update review. It may no longer exist." },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await db.courseReview.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin course review delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete review. It may no longer exist." },
      { status: 404 }
    );
  }
}
