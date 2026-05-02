import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import connectDB from "@/lib/db";
import User from "@/models/User";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { getMyNotifications } from "@/lib/actions/notification";
import ProjectsDropdown from "./ProjectsDropdown";
import MobileNav from "./MobileNav";

async function getUserData(userId: string) {
  try {
    await connectDB();
    const user = await User.findOne({ clerkUserId: userId })
      .select("firstName lastName avatarUrl skills profileComplete")
      .lean();
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error("Failed to load header user data:", error);
    return null;
  }
}

export default async function AppHeader() {
  const { userId } = await auth();
  if (!userId) return null;

  const dbUser = await getUserData(userId);
  if (!dbUser || !dbUser.profileComplete) return null;

  const userName = `${dbUser.firstName ?? ""} ${dbUser.lastName ?? ""}`.trim() || "Anonymous";
  const userSkills: string[] = dbUser.skills ?? [];
  const notifications = await getMyNotifications();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-7">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d7cf2] text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-[#0d7cf2]">MISTRI PRO</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-[#5e6d80] lg:flex">
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-[#0d7cf2]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h6v6H4zM14 6h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
              </svg>
              Dashboard
            </Link>
            <ProjectsDropdown />
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell
            userSkills={userSkills}
            currentUserId={userId}
            initialNotifications={notifications as Parameters<typeof NotificationBell>[0]["initialNotifications"]}
          />
          <Link
            href="/inbox"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5e6d80] transition hover:bg-gray-100 hover:text-[#0d7cf2]"
            aria-label="Inbox"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6zm0 0l8 6 8-6" />
            </svg>
          </Link>
          <div className="hidden lg:block">
            <ProfileMenu avatarUrl={dbUser.avatarUrl} userName={userName} />
          </div>
          <MobileNav avatarUrl={dbUser.avatarUrl} userName={userName} />
        </div>
      </div>
    </header>
  );
}
