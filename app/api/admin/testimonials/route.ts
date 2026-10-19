
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidImageUrl(value: string): boolean {
  return (
    /^https?:\/\/\S+$/i.test(value) ||
    /^\/uploads\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/i.test(value)
  );
}

function parseTestimonial(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const about = typeof body.about === "string" ? body.about.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const sortOrder = body.sortOrder === undefined ? 0 : body.sortOrder;
  const isPublished =
    body.isPublished === undefined ? false : body.isPublished;

  if (!name || name.length > 100) {
    return { error: "Name must be 1–100 characters." };
  }

  if (
    !imageUrl ||
    imageUrl.length > 2048 ||
    !isValidImageUrl(imageUrl)
  ) {
    return { error: "Please provide a valid HTTP, HTTPS or uploaded image URL." };
  }

  if (!about || about.length > 1000) {
    return { error: "About must be 1–1000 characters." };
  }

  if (!message || message.length > 3000) {
    return { error: "Message must be 1–3000 characters." };
  }

  if (
    !Number.isInteger(sortOrder) ||
    (sortOrder as number) < 0 ||
    (sortOrder as number) > 100000
  ) {
    return { error: "Sort order must be between 0 and 100000." };
  }

  if (typeof isPublished !== "boolean") {
    return { error: "Invalid publish status." };
  }

  return {
    data: {
      name,
      imageUrl,
      about,
      message,
      sortOrder: sortOrder as number,
      isPublished,
    },
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const testimonials = await db.candidateTestimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Admin testimonials load failed:", error);

    return NextResponse.json(
      { error: "Unable to load success stories." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseTestimonial(body);

    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const testimonial = await db.candidateTestimonial.create({
      data: parsed.data,
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error("Create testimonial failed:", error);

    return NextResponse.json(
      { error: "Unable to create success story." },
      { status: 503 }
    );
  }
}
