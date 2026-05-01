import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import connectDB from "@/lib/db";
import User from "@/models/User";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";

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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d7cf2] text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-[#0d7cf2]">MISTRI PRO</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#5e6d80] md:flex">
          <Link href="/dashboard" className="flex items-center gap-2 text-[#0d7cf2]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h6v6H4zM14 6h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
            </svg>
            Dashboard
          </Link>
          <Link href="/projects" className="flex items-center gap-2 hover:text-[#0d7cf2]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h10" />
            </svg>
            Browse Projects
          </Link>
          <Link href="/projects/mine" className="flex items-center gap-2 hover:text-[#0d7cf2]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h16v14H4zM8 5v14" />
            </svg>
            My Projects
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/projects/post"
            className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#0e1724] transition hover:bg-gray-50 sm:inline-flex"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post Project
          </Link>
          <NotificationBell userSkills={userSkills} currentUserId={userId} />
          <Link href="/inbox" className="text-[#5e6d80] hover:text-[#0d7cf2]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6zm0 0l8 6 8-6" />
            </svg>
          </Link>
          <ProfileMenu avatarUrl={dbUser.avatarUrl} userName={userName} />
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
