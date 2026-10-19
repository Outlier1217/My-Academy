
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Admin contact messages lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to load messages." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      typeof body.id !== "string" ||
      !body.id.trim() ||
      typeof body.isRead !== "boolean"
    ) {
      return NextResponse.json(
        { error: "A message ID and read status are required." },
        { status: 400 }
      );
    }

    const result = await db.contactMessage.updateMany({
      where: { id: body.id },
      data: { isRead: body.isRead },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin contact message update failed:", error);

    return NextResponse.json(
      { error: "Unable to update message." },
      { status: 500 }
    );
  }
}
