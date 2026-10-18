
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": { ext: ".jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { ext: ".png", signature: [0x89, 0x50, 0x4e, 0x47] },
  "image/webp": { ext: ".webp", signature: null },
  "image/gif": { ext: ".gif", signature: [0x47, 0x49, 0x46, 0x38] },
} as const;

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 }
      );
    }

    if (file.size < 1 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "The image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const type = file.type as keyof typeof imageTypes;
    const config = imageTypes[type];

    if (!config) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP and GIF files are supported." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validSignature =
      type === "image/webp"
        ? buffer.length >= 12 &&
          buffer.toString("ascii", 0, 4) === "RIFF" &&
          buffer.toString("ascii", 8, 12) === "WEBP"
        : config.signature!.every((byte, index) => buffer[index] === byte);

    if (!validSignature) {
      return NextResponse.json(
        { error: "The file contents do not match a supported image." },
        { status: 415 }
      );
    }

    const directory = path.resolve(
      process.cwd(),
      process.env.UPLOAD_DIR || "public/uploads"
    );

    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}${config.ext}`;

    await writeFile(path.join(directory, filename), buffer, {
      flag: "wx",
    });

    return NextResponse.json(
      { url: `/uploads/${filename}` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload failed:", error);

    return NextResponse.json(
      { error: "Upload failed. Check the server logs and storage permissions." },
      { status: 500 }
    );
  }
}
