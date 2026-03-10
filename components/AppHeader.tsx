import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import connectDB from "@/lib/db";
import User from "@/models/User";
import NotificationBell from "./NotificationBell";
import ProjectsDropdown from "./ProjectsDropdown";

async function getUserData(userId: string) {
  await connectDB();
  const user = await User.findOne({ clerkUserId: userId }).select("firstName lastName avatarUrl skills profileComplete").lean();
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export default async function AppHeader() {
  const { userId } = await auth();
  if (!userId) return null;

  const dbUser = await getUserData(userId);
  if (!dbUser || !dbUser.profileComplete) return null;

  const userName = `${dbUser.firstName ?? ""} ${dbUser.lastName ?? ""}`.trim() || "Anonymous";
  const userSkills: string[] = dbUser.skills ?? [];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard">
          <h1 className="text-xl font-extrabold tracking-tight cursor-pointer">
            <span className="text-[#0e1724]">MISTRI</span>{" "}
            <span className="text-[#0d7cf2]">PRO</span>
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          <ProjectsDropdown />
          <Link
            href="/projects/post"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Project
          </Link>
          <NotificationBell userSkills={userSkills} currentUserId={userId} />
          <Link href="/profile" className="flex items-center gap-2 group">
            {dbUser.avatarUrl ? (
              <img
                src={dbUser.avatarUrl}
                alt="avatar"
                loading="eager"
                decoding="async"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-[#0d7cf2]/30 group-hover:ring-[#0d7cf2] transition"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d7cf2] text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm font-medium text-[#0e1724] group-hover:text-[#0d7cf2] transition sm:inline">
              {userName}
            </span>
          </Link>
          <SignOutButton>
            <button className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#5e6d80] transition hover:bg-gray-50">
              Log Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
