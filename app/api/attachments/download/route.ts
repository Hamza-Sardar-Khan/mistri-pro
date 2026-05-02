import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function safeFilename(value: string | null) {
  const fallback = "attachment";
  if (!value) return fallback;
  return value.replace(/[^\w.\- ()]/g, "").trim() || fallback;
}

function isAllowedAttachmentUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function rawPublicIdFromCloudinaryUrl(value: string) {
  const url = new URL(value);
  const marker = "/raw/upload/";
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex === -1) return null;

  const afterUpload = url.pathname.slice(markerIndex + marker.length);
  const parts = afterUpload.split("/").filter(Boolean);
  if (parts[0] && /^v\d+$/.test(parts[0])) parts.shift();
  if (parts.length === 0) return null;

  return decodeURIComponent(parts.join("/"));
}

async function fetchAttachment(attachmentUrl: string) {
  const rawPublicId = rawPublicIdFromCloudinaryUrl(attachmentUrl);

  if (
    rawPublicId &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    const signedDownloadUrl = cloudinary.utils.private_download_url(
      rawPublicId,
      "",
      {
        resource_type: "raw",
        type: "upload",
        attachment: true,
        expires_at: Math.floor(Date.now() / 1000) + 300,
      }
    );

    const signedResponse = await fetch(signedDownloadUrl, { cache: "no-store" });
    if (signedResponse.ok) return signedResponse;
  }

  return fetch(attachmentUrl, { cache: "no-store" });
}

export async function GET(request: NextRequest) {
  const attachmentUrl = request.nextUrl.searchParams.get("url");
  const filename = safeFilename(request.nextUrl.searchParams.get("name"));

  if (!attachmentUrl || !isAllowedAttachmentUrl(attachmentUrl)) {
    return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
  }

  try {
    const upstream = await fetchAttachment(attachmentUrl);
    if (!upstream.ok || !upstream.body) {
      const providerError = upstream.headers.get("x-cld-error");
      return NextResponse.json(
        { error: providerError || "Attachment could not be downloaded" },
        { status: upstream.status || 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(upstream.body, { headers });
  } catch (error) {
    console.error("Attachment download error:", error);
    return NextResponse.json(
      { error: "Attachment could not be downloaded" },
      { status: 502 }
    );
  }
}
