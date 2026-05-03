import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const targetUserId = body?.targetUserId as string | undefined;
  const action = body?.action as "follow" | "unfollow" | undefined;

  if (!targetUserId || (action !== "follow" && action !== "unfollow")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  await connectDB();

  await User.findOneAndUpdate(
    { clerkUserId: user.id },
    {
      $setOnInsert: {
        clerkUserId: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        avatarUrl: user.imageUrl ?? "",
      },
    },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { clerkUserId: targetUserId },
    { $setOnInsert: { clerkUserId: targetUserId } },
    { upsert: true }
  );

  if (action === "follow") {
    await User.findOneAndUpdate(
      { clerkUserId: user.id },
      { $addToSet: { following: targetUserId } }
    );

    const target = await User.findOneAndUpdate(
      { clerkUserId: targetUserId },
      { $addToSet: { followers: user.id } },
      { new: true }
    ).select("followers").lean();

    return NextResponse.json({
      isFollowing: true,
      followersCount: target?.followers?.length ?? 0,
    });
  }

  await User.findOneAndUpdate(
    { clerkUserId: user.id },
    { $pull: { following: targetUserId } }
  );

  const target = await User.findOneAndUpdate(
    { clerkUserId: targetUserId },
    { $pull: { followers: user.id } },
    { new: true }
  ).select("followers").lean();

  return NextResponse.json({
    isFollowing: false,
    followersCount: target?.followers?.length ?? 0,
  });
}
