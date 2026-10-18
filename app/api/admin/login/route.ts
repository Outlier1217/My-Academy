import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    console.log("Admin login diagnostics:", {
  configuredEmail: Boolean(configuredEmail),
  emailMatches:
    parsed.data.email.trim().toLowerCase() === configuredEmail,
  hashPresent: Boolean(passwordHash),
  hashFormatValid: /^\$2[aby]\$\d{2}\$/.test(passwordHash || ""),
  passwordMatches: passwordHash
    ? await bcrypt.compare(parsed.data.password, passwordHash)
    : false,
});
    if (!configuredEmail || !passwordHash || !process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "Admin sign-in is not configured on the server yet." }, { status: 503 });
    }

    const emailMatches = parsed.data.email.trim().toLowerCase() === configuredEmail;
    const passwordMatches = await bcrypt.compare(parsed.data.password, passwordHash);
    if (!emailMatches || !passwordMatches) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await createAdminSession(configuredEmail);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin login failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Unable to sign in. Check the server configuration." }, { status: 500 });
  }
}
