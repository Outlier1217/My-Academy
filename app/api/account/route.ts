
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to view your account." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const [bookmarks, favourites, attempts] = await Promise.all([
      db.bookmark.findMany({
        where: {
          userId,
          content: { status: "PUBLISHED" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          content: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              subject: true,
              excerpt: true,
              coverImageUrl: true,
            },
          },
        },
      }),

      db.favourite.findMany({
        where: {
          userId,
          content: { status: "PUBLISHED" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          content: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              subject: true,
              excerpt: true,
              coverImageUrl: true,
            },
          },
        },
      }),

      db.mockTestAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          testTitle: true,
          testSlug: true,
          score: true,
          maximumScore: true,
          percentage: true,
          passed: true,
          correctCount: true,
          wrongCount: true,
          unansweredCount: true,
          result: true,
          shareToken: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      user,
      bookmarks,
      favourites,
      attempts,
    });
  } catch (error) {
    console.error("Account dashboard API error:", error);

    return NextResponse.json(
      { error: "Unable to load your account data." },
      { status: 503 }
    );
  }
}
