
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    const body = await request.json();
    const message = typeof body.message === "string"
      ? body.message.trim()
      : "";

    if (!message || message.length > 5000) {
      return NextResponse.json(
        { error: "Message must contain 1–5000 characters." },
        { status: 400 }
      );
    }

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
          { error: "Please enter a name of up to 100 characters." },
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

    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email,
        message,
        userId: userId ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been received.",
        id: contactMessage.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact submission failed:", error);

    return NextResponse.json(
      { error: "Unable to send your message right now." },
      { status: 500 }
    );
  }
}
