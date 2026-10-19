
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: { slug: string };
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const course = await db.contentItem.findFirst({
      where: {
        slug: params.slug,
        type: "COURSE",
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    const reviews = await db.courseReview.findMany({
      where: { contentId: course.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        rating: true,
        feedback: true,
        createdAt: true,
      },
    });

    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      count: reviews.length,
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error) {
    console.error("Course reviews lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to load reviews." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const body = await request.json();

    const rating = Number(body.rating);
    const feedback = typeof body.feedback === "string"
      ? body.feedback.trim()
      : "";

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Please select a rating from 1 to 5." },
        { status: 400 }
      );
    }

    if (!feedback || feedback.length > 3000) {
      return NextResponse.json(
        { error: "Feedback must contain 1–3000 characters." },
        { status: 400 }
      );
    }

    const course = await db.contentItem.findFirst({
      where: {
        slug: params.slug,
        type: "COURSE",
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    const userId = await getAuthenticatedUserId();

    let name: string;
    let email: string;

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Please sign in again." },
          { status: 401 }
        );
      }

      name = user.name;
      email = user.email;
    } else {
      name = typeof body.name === "string" ? body.name.trim() : "";
      email = typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

      if (!name || name.length > 100) {
        return NextResponse.json(
          { error: "Please enter your name." },
          { status: 400 }
        );
      }

      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return NextResponse.json(
          { error: "Please enter a valid email address." },
          { status: 400 }
        );
      }
    }

    const review = await db.courseReview.create({
      data: {
        contentId: course.id,
        userId: userId ?? null,
        name,
        email,
        rating,
        feedback,
      },
      select: {
        id: true,
        name: true,
        rating: true,
        feedback: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Course review submission failed:", error);

    return NextResponse.json(
      { error: "Unable to submit your review." },
      { status: 500 }
    );
  }
}
