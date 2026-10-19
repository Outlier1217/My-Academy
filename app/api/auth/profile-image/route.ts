
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": { extension: ".jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": {
    extension: ".png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  "image/gif": { extension: ".gif", signature: [0x47, 0x49, 0x46, 0x38] },
} as const;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const config =
      IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];

    if (!config) {
      return NextResponse.json(
        { error: "Use a JPG, PNG or GIF image." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const signatureMatches = config.signature.every(
      (byte, index) => buffer[index] === byte
    );

    if (!signatureMatches) {
      return NextResponse.json(
        { error: "The file content does not match its image type." },
        { status: 400 }
      );
    }

    const directory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );

    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}${config.extension}`;

    await writeFile(path.join(directory, filename), buffer, {
      flag: "wx",
    });

    return NextResponse.json(
      { url: `/uploads/profiles/${filename}` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Profile image upload error:", error);

    return NextResponse.json(
      { error: "Unable to upload this image. Please try again." },
      { status: 500 }
    );
  }
}
