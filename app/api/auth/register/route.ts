
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth";

export const runtime = "nodejs";

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
    profileImageUrl: z
      .string()
      .max(500)
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      !data.profileImageUrl ||
      data.profileImageUrl === "" ||
      data.profileImageUrl.startsWith("/uploads/"),
    {
      message: "Invalid profile image path.",
      path: ["profileImageUrl"],
    }
  );

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid registration details.",
        },
        { status: 400 }
      );
    }

    const { name, password, profileImageUrl } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        profileImageUrl: profileImageUrl || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
      },
    });

    await createUserSession(user.id);

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handles duplicate-email races safely.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Unable to create your account right now. Please try again." },
      { status: 500 }
    );
  }
}
