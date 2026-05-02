import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Upload service is not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "File is larger than 25 MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type;

    let resourceType: "image" | "video" | "raw" = "raw";
    if (mime.startsWith("image/")) resourceType = "image";
    else if (mime.startsWith("video/")) resourceType = "video";
    else if (mime.startsWith("audio")) resourceType = "video"; // Cloudinary handles audio under "video"

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mistri-pro",
          resource_type: resourceType,
          use_filename: true,
          filename_override: file.name,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Upload failed"));
            return;
          }
          resolve(uploadResult);
        }
      );

      stream.end(buffer);
    });

    const clientType = mime.startsWith("image")
      ? "image"
      : mime.startsWith("audio")
        ? "audio"
        : mime.startsWith("video")
          ? "video"
          : "file";

    return NextResponse.json({
      url: result.secure_url,
      type: clientType,
      name: file.name,
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
