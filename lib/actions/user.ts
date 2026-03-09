"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

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
