
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 }
      );
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
        createdAt: true,

        bookmarks: {
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
                status: true,
              },
            },
          },
        },

        favourites: {
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
                status: true,
              },
            },
          },
        },

        attempts: {
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
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Admin users API error:", error);

    return NextResponse.json(
      { error: "Unable to load users." },
      { status: 500 }
    );
  }
}
