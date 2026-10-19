
import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearUserSession();

    return NextResponse.json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Unable to log out right now." },
      { status: 500 }
    );
  }
}
