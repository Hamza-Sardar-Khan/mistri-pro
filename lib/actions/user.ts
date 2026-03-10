"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import type { Skill } from "@/lib/constants";

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

  return JSON.parse(JSON.stringify(dbUser));
}
