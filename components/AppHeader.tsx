import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import connectDB from "@/lib/db";
import User from "@/models/User";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { getMyNotifications } from "@/lib/actions/notification";
import ProjectsDropdown from "./ProjectsDropdown";
import MobileNav from "./MobileNav";
import MessagesBell from "./MessagesBell";

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
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b0f1a]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-20">
          <Link href="/dashboard" >
            <Image
              src="/logo-light.png"
              alt="Mistri Pro"
              width={240}
              height={40}
              className="h-9 w-auto left-8 2xl:left-0 scale-300 2xl:scale-400 relative top-1 "
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 text-base font-medium text-white lg:flex">
            <Link href="/dashboard" className="flex items-center gap-2 text-white hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h6v6H4zM14 6h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
              </svg>
              Dashboard
            </Link>
            <ProjectsDropdown />
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/projects/post"
            className="hidden items-center gap-2 rounded-lg bg-[#0d7cf2] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_-12px_rgba(13,124,242,0.8)] transition hover:bg-[#0b6ad4] sm:inline-flex"
          >
            <span className="text-base leading-none">+</span>
            Post a Project
          </Link>
          <NotificationBell
            userSkills={userSkills}
            currentUserId={userId}
            initialNotifications={notifications as Parameters<typeof NotificationBell>[0]["initialNotifications"]}
          />
          <MessagesBell
            currentUserId={userId}
            initialNotifications={notifications as Parameters<typeof MessagesBell>[0]["initialNotifications"]}
          />
          <div className="hidden lg:block">
            <ProfileMenu avatarUrl={dbUser.avatarUrl} userName={userName} />
          </div>
          <MobileNav avatarUrl={dbUser.avatarUrl} userName={userName} />
        </div>
      </div>
    </header>
  );
}
