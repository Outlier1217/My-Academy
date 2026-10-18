
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;

  // Only allow generated UUID image filenames.
  if (
    !/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i.test(filename)
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const uploadDirectory = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads")
  );

  try {
    const filePath = path.join(uploadDirectory, filename);
    const buffer = await readFile(filePath);
    const extension = path.extname(filename).toLowerCase();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension],
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
