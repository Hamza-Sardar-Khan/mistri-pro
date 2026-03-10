import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncAndCheckProfile } from "@/lib/actions/user";
import { getPosts } from "@/lib/actions/post";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Single call: sync user + check profile completion
  const result = await syncAndCheckProfile();
  if (!result) redirect("/");
  if (!result.profileComplete) redirect("/profile-setup");

  const [user, posts] = await Promise.all([currentUser(), getPosts()]);
  if (!user) redirect("/");
  const userName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous";

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Feed */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Mobile post project button */}
        <Link
          href="/projects/post"
          className="mb-4 flex sm:hidden items-center justify-center gap-2 rounded-xl border border-[#0d7cf2] bg-[#0d7cf2]/5 px-4 py-3 text-sm font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2]/10"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post a Project
        </Link>

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
