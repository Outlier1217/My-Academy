
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = { params: { id: string } };

function isValidImageUrl(value: string): boolean {
  return (
    /^https?:\/\/\S+$/i.test(value) ||
    /^\/uploads\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/i.test(value)
  );
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const data: {
      name?: string;
      imageUrl?: string;
      about?: string;
      message?: string;
      sortOrder?: number;
      isPublished?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 100
      ) {
        return NextResponse.json(
          { error: "Invalid name." },
          { status: 400 }
        );
      }

      data.name = body.name.trim();
    }

    if (body.imageUrl !== undefined) {
      if (typeof body.imageUrl !== "string") {
        return NextResponse.json(
          { error: "Invalid image URL." },
          { status: 400 }
        );
      }

      const imageUrl = body.imageUrl.trim();

      if (
        imageUrl.length > 2048 ||
        !isValidImageUrl(imageUrl)
      ) {
        return NextResponse.json(
          { error: "Invalid image URL." },
          { status: 400 }
        );
      }

      data.imageUrl = imageUrl;
    }

    if (body.about !== undefined) {
      if (
        typeof body.about !== "string" ||
        !body.about.trim() ||
        body.about.trim().length > 1000
      ) {
        return NextResponse.json(
          { error: "About must be 1–1000 characters." },
          { status: 400 }
        );
      }

      data.about = body.about.trim();
    }

    if (body.message !== undefined) {
      if (
        typeof body.message !== "string" ||
        !body.message.trim() ||
        body.message.trim().length > 3000
      ) {
        return NextResponse.json(
          { error: "Message must be 1–3000 characters." },
          { status: 400 }
        );
      }

      data.message = body.message.trim();
    }

    if (body.sortOrder !== undefined) {
      if (
        !Number.isInteger(body.sortOrder) ||
        body.sortOrder < 0 ||
        body.sortOrder > 100000
      ) {
        return NextResponse.json(
          { error: "Invalid sort order." },
          { status: 400 }
        );
      }

      data.sortOrder = body.sortOrder;
    }

    if (body.isPublished !== undefined) {
      if (typeof body.isPublished !== "boolean") {
        return NextResponse.json(
          { error: "Invalid publish status." },
          { status: 400 }
        );
      }

      data.isPublished = body.isPublished;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json(
        { error: "No valid changes provided." },
        { status: 400 }
      );
    }

    const testimonial = await db.candidateTestimonial.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error("Update testimonial failed:", error);

    return NextResponse.json(
      { error: "Unable to update success story. It may no longer exist." },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await db.candidateTestimonial.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete testimonial failed:", error);

    return NextResponse.json(
      { error: "Unable to delete success story. It may no longer exist." },
      { status: 404 }
    );
  }
}
