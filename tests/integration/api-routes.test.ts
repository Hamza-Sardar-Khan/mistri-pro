import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as downloadAttachment } from "@/app/api/attachments/download/route";
import { POST as uploadFile } from "@/app/api/upload/route";

describe("API route validation", () => {
  it("rejects uploads when no file is provided", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";

    const formData = new FormData();
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }) as NextRequest;

    const response = await uploadFile(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("No file provided");
  });

  it("rejects files larger than the 25 MB upload limit", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";

    const formData = new FormData();
    const file = new File([new Uint8Array(25 * 1024 * 1024 + 1)], "large.pdf", {
      type: "application/pdf",
    });
    formData.append("file", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }) as NextRequest;

    const response = await uploadFile(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("File is larger than 25 MB");
  });

  it("rejects attachment downloads from non-Cloudinary URLs", async () => {
    const request = new NextRequest(
      "http://localhost/api/attachments/download?url=https%3A%2F%2Fexample.com%2Ffile.pdf&name=file.pdf"
    );

    const response = await downloadAttachment(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid attachment URL");
  });
});
