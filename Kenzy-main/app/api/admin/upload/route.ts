import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

// Max upload size: 5 MB
const MAX_BYTES = 5 * 1024 * 1024;

// Strict whitelist of allowed image types + their file extensions.
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_BYTES / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported type "${file.type}". Use PNG, JPG, WEBP, GIF, or SVG.` },
        { status: 415 }
      );
    }

    // Generate a safe random filename â€” ignore the client-supplied name
    // entirely to prevent path traversal and collisions.
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, name), buffer);

    return NextResponse.json({
      url: `/uploads/${name}`,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
