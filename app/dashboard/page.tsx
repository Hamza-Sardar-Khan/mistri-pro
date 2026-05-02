import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncAndCheckProfile } from "@/lib/actions/user";
import { getPosts } from "@/lib/actions/post";
import { getTrendingProjectSkills } from "@/lib/actions/project";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardPost = {
  _id: string;
  authorClerkId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  reactions: { userId: string; userName: string; type: string }[];
  comments: {
    _id: string;
    clerkUserId: string;
    name: string;
    text: string;
    likes: string[];
    replies: {
      _id: string;
      clerkUserId: string;
      name: string;
      text: string;
      likes: string[];
      createdAt: string;
    }[];
    createdAt: string;
  }[];
  createdAt: string;
  repostOriginal?: {
    authorName: string;
    authorAvatar: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: string;
  };
};

export default async function DashboardPage() {
  // Single call: sync user + check profile completion
  const result = await syncAndCheckProfile();
  if (!result) redirect("/");
  if (!result.profileComplete) redirect("/profile-setup");

  const [user, posts, trendingSkills] = await Promise.all([
    currentUser(),
    getPosts(),
    getTrendingProjectSkills(4),
  ]);
  if (!user) redirect("/");
  const userName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous";
  const dbAvatar = result.user?.avatarUrl ?? "";
  const dashboardPosts = posts as DashboardPost[];

  const followSuggestions: { name: string; clerkUserId: string }[] = dashboardPosts
    .reduce(
      (acc: { name: string; clerkUserId: string }[], post) => {
        if (!post.authorClerkId || post.authorClerkId === user.id) {
          return acc;
        }

        if (!acc.find((item) => item.clerkUserId === post.authorClerkId)) {
          acc.push({
            name: post.authorName || "Anonymous",
            clerkUserId: post.authorClerkId,
          });
        }
        return acc;
      },
      []
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr_260px]">
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
            <nav className="space-y-2 text-sm">
              <Link className="flex items-center gap-2 rounded-xl bg-[#e9f2ff] px-4 py-2 font-semibold text-[#0d7cf2]" href="/dashboard">
                <span className="h-2 w-2 rounded-full bg-[#0d7cf2]" />
                Home Feed
              </Link>
              <Link className="flex items-center gap-2 rounded-xl px-4 py-2 text-[#5e6d80] hover:bg-white" href="/projects/mine">
                <span className="h-2 w-2 rounded-full bg-[#cbd5e1]" />
                My Projects
              </Link>
              <Link className="flex items-center gap-2 rounded-xl px-4 py-2 text-[#5e6d80] hover:bg-white" href="/projects/saved">
                <span className="h-2 w-2 rounded-full bg-[#cbd5e1]" />
                Saved Projects
              </Link>
              <Link className="flex items-center gap-2 rounded-xl px-4 py-2 text-[#5e6d80] hover:bg-white" href="/projects">
                <span className="h-2 w-2 rounded-full bg-[#cbd5e1]" />
                Local Jobs
              </Link>
            </nav>
          </aside>

          <section>
            <Link
              href="/projects/post"
              className="mb-4 flex sm:hidden items-center justify-center gap-2 rounded-xl border border-[#0d7cf2] bg-[#0d7cf2]/5 px-4 py-3 text-sm font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2]/10"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post a Project
            </Link>

            <CreatePostPrompt
              userAvatar={dbAvatar}
              userFallbackAvatar={user.imageUrl ?? ""}
              userName={userName}
            />

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[#97a4b3]">
                <span>Recent updates</span>
              </div>
              <div className="mt-4 space-y-4">
                {dashboardPosts.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-[#97a4b3]">
                    <p className="text-base font-medium">No posts yet</p>
                    <p className="mt-1 text-sm">Be the first to share something!</p>
                  </div>
                ) : (
                  dashboardPosts.map((post) => (
                    <PostCard
                      key={post._id as string}
                      post={post}
                      currentUserId={user.id}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="hidden lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0e1724]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e9f2ff] text-[#0d7cf2]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17l6-6 4 4 6-6" />
                  </svg>
                </span>
                Trending Skills
              </h3>
              <div className="mt-3 space-y-3 text-sm text-[#5e6d80]">
                {trendingSkills.length === 0 ? (
                  <p className="text-xs text-[#97a4b3]">No trends yet.</p>
                ) : (
                  trendingSkills.map((item) => (
                    <Link
                      key={item.skill}
                      href={`/projects?category=${encodeURIComponent(item.skill)}`}
                      className="block rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
                    >
                      <p className="font-semibold text-[#0e1724]">{item.skill}</p>
                      <p className="text-xs">{item.count} open job{item.count === 1 ? "" : "s"}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-[#0e1724]">Who to follow</h3>
              <div className="mt-3 space-y-3 text-sm text-[#5e6d80]">
                {followSuggestions.length === 0 ? (
                  <p className="text-xs text-[#97a4b3]">More people to follow soon.</p>
                ) : (
                  followSuggestions.map((suggestion) => (
                    <div key={suggestion.clerkUserId} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#0e1724]">{suggestion.name}</p>
                        <p className="text-xs">Recently active</p>
                      </div>
                      <Link
                        href={`/profile/${suggestion.clerkUserId}`}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-[#0d7cf2]"
                      >
                        View
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
