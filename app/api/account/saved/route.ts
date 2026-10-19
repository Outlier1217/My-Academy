
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  contentId: z.string().min(1).max(100),
  kind: z.enum(["bookmark", "favourite"]),
});



export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to view saved status." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId || contentId.length > 100) {
      return NextResponse.json(
        { error: "A valid content ID is required." },
        { status: 400 }
      );
    }

    const [bookmark, favourite] = await Promise.all([
      db.bookmark.findUnique({
        where: {
          userId_contentId: { userId, contentId },
        },
        select: { id: true },
      }),
      db.favourite.findUnique({
        where: {
          userId_contentId: { userId, contentId },
        },
        select: { id: true },
      }),
    ]);

    return NextResponse.json({
      bookmark: Boolean(bookmark),
      favourite: Boolean(favourite),
    });
  } catch (error) {
    console.error("Saved status API error:", error);

    return NextResponse.json(
      { error: "Unable to check saved status." },
      { status: 503 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to save content." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid saved-content request." },
        { status: 400 }
      );
    }

    const { contentId, kind } = parsed.data;

    const content = await db.contentItem.findFirst({
      where: {
        id: contentId,
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    if (!content) {
      return NextResponse.json(
        { error: "Published content not found." },
        { status: 404 }
      );
    }

    if (kind === "bookmark") {
      await db.bookmark.upsert({
        where: {
          userId_contentId: { userId, contentId },
        },
        create: { userId, contentId },
        update: {},
      });
    } else {
      await db.favourite.upsert({
        where: {
          userId_contentId: { userId, contentId },
        },
        create: { userId, contentId },
        update: {},
      });
    }

    return NextResponse.json({ ok: true, kind, contentId });
  } catch (error) {
    console.error("Save content API error:", error);

    return NextResponse.json(
      { error: "Unable to save this content." },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to manage saved content." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid saved-content request." },
        { status: 400 }
      );
    }

    const { contentId, kind } = parsed.data;

    if (kind === "bookmark") {
      await db.bookmark.deleteMany({
        where: { userId, contentId },
      });
    } else {
      await db.favourite.deleteMany({
        where: { userId, contentId },
      });
    }

    return NextResponse.json({ ok: true, kind, contentId });
  } catch (error) {
    console.error("Remove saved content API error:", error);

    return NextResponse.json(
      { error: "Unable to remove saved content." },
      { status: 503 }
    );
  }
}
