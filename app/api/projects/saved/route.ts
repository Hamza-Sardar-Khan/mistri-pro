import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Project from "@/models/Project";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids") ?? "";
  const projectIds = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (projectIds.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  await connectDB();
  const projects = await Project.find({ _id: { $in: projectIds } }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ projects: JSON.parse(JSON.stringify(projects)) });
}
