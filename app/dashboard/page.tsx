import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/actions/user";
import { getPosts } from "@/lib/actions/post";
import { SignOutButton } from "@clerk/nextjs";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  // Sync user to MongoDB on first visit
  await syncUser();

  // Fetch posts
  const posts = await getPosts();
  const userName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous";

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="text-[#0e1724]">MISTRI</span>{" "}
            <span className="text-[#0d7cf2]">PRO</span>
          </h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="avatar"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[#0d7cf2]/30"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d7cf2] text-xs font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden text-sm font-medium text-[#0e1724] sm:inline">
                {userName}
              </span>
            </div>
            <SignOutButton>
              <button className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#5e6d80] transition hover:bg-gray-50">
                Log Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Create post prompt */}
        <CreatePostPrompt
          userAvatar={user.imageUrl ?? ""}
          userName={userName}
        />

        {/* Posts feed */}
        <div className="mt-5 space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-[#97a4b3]">
              <p className="text-base font-medium">No posts yet</p>
              <p className="mt-1 text-sm">Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post: Record<string, unknown>) => (
              <PostCard
                key={post._id as string}
                post={post as any}
                currentUserId={user.id}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
