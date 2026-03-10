import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer then to base64 data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mime = file.type;
    const dataUri = `data:${mime};base64,${base64}`;

    // Determine resource type
    let resourceType: "image" | "video" | "raw" = "image";
    if (mime.startsWith("video")) resourceType = "video";
    else if (mime.startsWith("audio")) resourceType = "video"; // Cloudinary handles audio under "video"

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "mistri-pro",
      resource_type: resourceType,
    });

    // Return a normalized type for the client
    const clientType = mime.startsWith("audio") ? "audio" : mime.startsWith("video") ? "video" : "image";

    return NextResponse.json({
      url: result.secure_url,
      type: clientType,
    });
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
