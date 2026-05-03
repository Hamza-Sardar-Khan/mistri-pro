"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import type { Skill } from "@/lib/constants";
import { revalidatePath } from "next/cache";

/**
 * Ensures the currently signed-in Clerk user has a corresponding
 * document in our MongoDB User collection.  Returns the DB user.
 */
export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectDB();

  // Check if user already exists
  let dbUser = await User.findOne({ clerkUserId: clerkUser.id });

  if (!dbUser) {
    dbUser = await User.create({
      clerkUserId: clerkUser.id,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      avatarUrl: clerkUser.imageUrl ?? "",
    });
  }

  return JSON.parse(JSON.stringify(dbUser)); // serialize for client
}

/**
 * Check if the current user has completed their profile setup.
 */
export async function isProfileComplete() {
  const clerkUser = await currentUser();
  if (!clerkUser) return false;

  await connectDB();
  const dbUser = await User.findOne({ clerkUserId: clerkUser.id });
  return dbUser?.profileComplete === true;
}

/**
 * Combined sync + profile-check in a single DB round-trip.
 * Returns { user, profileComplete } or null if not authenticated.
 */
export async function syncAndCheckProfile() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectDB();

  let dbUser = await User.findOne({ clerkUserId: clerkUser.id });

  if (!dbUser) {
    dbUser = await User.create({
      clerkUserId: clerkUser.id,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      avatarUrl: clerkUser.imageUrl ?? "",
    });
  }

  return {
    user: JSON.parse(JSON.stringify(dbUser)),
    profileComplete: dbUser.profileComplete === true,
  };
}

/**
 * Get the full profile of the current user.
 */
export async function getMyProfile() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectDB();
  const dbUser = await User.findOne({ clerkUserId: clerkUser.id });
  if (!dbUser) return null;

  return JSON.parse(JSON.stringify(dbUser));
}

/**
 * Get a user's profile by their clerk ID.
 */
export async function getUserProfile(clerkUserId: string) {
  await connectDB();
  const dbUser = await User.findOne({ clerkUserId });
  if (!dbUser) return null;

  return JSON.parse(JSON.stringify(dbUser));
}

/**
 * Save the profile setup data for the current user.
 */
export async function saveProfileSetup(data: {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  title: string;
  bio: string;
  hourlyRate: number;
  phone: string;
  city: string;
  country: string;
  skills: Skill[];
  education: string;
  experience: string;
  languages: string[];
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Not authenticated");

  await connectDB();

  const hashtag = `@${data.firstName}${data.lastName}`.toLowerCase().replace(/\s+/g, "");

  const dbUser = await User.findOneAndUpdate(
    { clerkUserId: clerkUser.id },
    {
      ...data,
      hashtag,
      profileComplete: true,
    },
    { new: true, upsert: true }
  );

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(dbUser));
}

export async function getUserSummariesByIds(clerkUserIds: string[]) {
  if (clerkUserIds.length === 0) return [];
  await connectDB();

  const users = await User.find({ clerkUserId: { $in: clerkUserIds } })
    .select("clerkUserId firstName lastName avatarUrl followers")
    .lean();

  return users.map((user) => ({
    clerkUserId: user.clerkUserId,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    avatarUrl: user.avatarUrl ?? "",
    followersCount: user.followers?.length ?? 0,
  }));
}

export async function getTopUserSummaries(limit: number, excludeClerkUserId?: string) {
  if (limit <= 0) return [];
  await connectDB();

  const matchStage = excludeClerkUserId
    ? { clerkUserId: { $ne: excludeClerkUserId } }
    : {};

  const users = await User.aggregate([
    { $match: matchStage },
    { $addFields: { followersCount: { $size: { $ifNull: ["$followers", []] } } } },
    { $sort: { followersCount: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        clerkUserId: 1,
        firstName: 1,
        lastName: 1,
        avatarUrl: 1,
        followersCount: 1,
      },
    },
  ]);

  return users.map((user) => ({
    clerkUserId: user.clerkUserId,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    avatarUrl: user.avatarUrl ?? "",
    followersCount: user.followersCount ?? 0,
  }));
}

export async function getFollowStats(clerkUserId: string) {
  await connectDB();
  const user = await User.findOne({ clerkUserId }).select("followers following").lean();
  if (!user) return { followersCount: 0, followingCount: 0 };

  return {
    followersCount: user.followers?.length ?? 0,
    followingCount: user.following?.length ?? 0,
  };
}

export async function getFollowState(targetClerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { isFollowing: false };
  if (clerkUser.id === targetClerkUserId) return { isFollowing: false };

  await connectDB();
  const user = await User.findOne({ clerkUserId: clerkUser.id })
    .select("following")
    .lean();

  const isFollowing = Boolean(user?.following?.includes(targetClerkUserId));
  return { isFollowing };
}

export async function getMyFollowingIds() {
  const clerkUser = await currentUser();
  if (!clerkUser) return [];

  await connectDB();
  const user = await User.findOne({ clerkUserId: clerkUser.id })
    .select("following")
    .lean();

  return user?.following ?? [];
}

export async function followUser(targetClerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Not authenticated");
  if (clerkUser.id === targetClerkUserId) return { isFollowing: false, followersCount: 0 };

  await connectDB();

  await User.findOneAndUpdate(
    { clerkUserId: clerkUser.id },
    {
      $setOnInsert: {
        clerkUserId: clerkUser.id,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
        avatarUrl: clerkUser.imageUrl ?? "",
      },
    },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { clerkUserId: targetClerkUserId },
    { $setOnInsert: { clerkUserId: targetClerkUserId } },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { clerkUserId: clerkUser.id },
    { $addToSet: { following: targetClerkUserId } }
  );

  const target = await User.findOneAndUpdate(
    { clerkUserId: targetClerkUserId },
    { $addToSet: { followers: clerkUser.id } },
    { new: true }
  ).select("followers");

  revalidatePath("/dashboard");
  revalidatePath(`/profile/${targetClerkUserId}`);
  revalidatePath("/profile");

  return {
    isFollowing: true,
    followersCount: target?.followers?.length ?? 0,
  };
}

export async function unfollowUser(targetClerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Not authenticated");
  if (clerkUser.id === targetClerkUserId) return { isFollowing: false, followersCount: 0 };

  await connectDB();

  await User.findOneAndUpdate(
    { clerkUserId: clerkUser.id },
    { $setOnInsert: { clerkUserId: clerkUser.id } },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { clerkUserId: targetClerkUserId },
    { $setOnInsert: { clerkUserId: targetClerkUserId } },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { clerkUserId: clerkUser.id },
    { $pull: { following: targetClerkUserId } }
  );

  const target = await User.findOneAndUpdate(
    { clerkUserId: targetClerkUserId },
    { $pull: { followers: clerkUser.id } },
    { new: true }
  ).select("followers");

  revalidatePath("/dashboard");
  revalidatePath(`/profile/${targetClerkUserId}`);
  revalidatePath("/profile");

  return {
    isFollowing: false,
    followersCount: target?.followers?.length ?? 0,
  };
}
