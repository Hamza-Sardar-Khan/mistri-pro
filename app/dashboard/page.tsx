import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyFollowingIds, getTopUserSummaries, getUserSummariesByIds, syncAndCheckProfile } from "@/lib/actions/user";
import { getPosts } from "@/lib/actions/post";
import { getTrendingProjectSkills } from "@/lib/actions/project";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import { Bookmark, Briefcase, Home, MapPin, MessageSquare, Settings } from "lucide-react";

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

  const suggestionIds = Array.from(
    new Set(
      dashboardPosts
        .map((post) => post.authorClerkId)
        .filter((id): id is string => Boolean(id) && id !== user.id)
    )
  ).slice(0, 6);

  const [followSuggestions, myFollowingIds] = await Promise.all([
    getUserSummariesByIds(suggestionIds),
    getMyFollowingIds(),
  ]);

  const fallbackSuggestions =
    followSuggestions.length === 0 ? await getTopUserSummaries(5, user.id) : [];
  const suggestionsToShow =
    followSuggestions.length > 0 ? followSuggestions : fallbackSuggestions;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr_260px]">
         <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start w-59 pr-4">
            <nav className="space-y-1 text-sm font-medium">
              
              {/* Active Link */}
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 rounded-xl bg-[#0d7cf2] px-4 py-3 font-semibold text-[white] transition-colors duration-200"
              >
                <Home className="h-5 w-5 text-[white]" strokeWidth={2.5} />
                Home Feed
              </Link>

              {/* Inactive Links */}
              <Link 
                href="/projects/mine" 
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#5e6d80] transition-colors duration-200 hover:bg-white hover:text-gray-900"
              >
                <Briefcase className="h-5 w-5 text-[#cbd5e1]" strokeWidth={2} />
                My Projects
              </Link>

              <Link 
                href="/projects/saved" 
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#5e6d80] transition-colors duration-200 hover:bg-white hover:text-gray-900"
              >
                <Bookmark className="h-5 w-5 text-[#cbd5e1]" strokeWidth={2} />
                Saved Projects
              </Link>

              <Link 
                href="/projects" 
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#5e6d80] transition-colors duration-200 hover:bg-white hover:text-gray-900"
              >
                <MapPin  className="h-5 w-5 text-[#cbd5e1]" strokeWidth={2} />
                Local Jobs
              </Link>

              {/* Recommended Additions */}
              <Link 
                href="/inbox" 
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#5e6d80] transition-colors duration-200 hover:bg-white hover:text-gray-900"
              >
                <MessageSquare className="h-5 w-5 text-[#cbd5e1]" strokeWidth={2} />
                Messages
              </Link>

              <Link 
                href="/profile/edit" 
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#5e6d80] transition-colors duration-200 hover:bg-white hover:text-gray-900"
              >
                <Settings className="h-5 w-5 text-[#cbd5e1]" strokeWidth={2} />
                Settings
              </Link>
              
            </nav>

            {/* Optional Bottom Section */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <Link 
                href="/help" 
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#5e6d80] transition-colors duration-200 hover:bg-white hover:text-gray-900"
              >
                Help & Support
              </Link>
            </div>
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
                  trendingSkills.map((item, index) => (
                    <div key={item.skill}>
                      <Link
                        href={`/projects?category=${encodeURIComponent(item.skill)}`}
                        className="block rounded-lg px-2 py-1 transition hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-semibold text-[#1f2937]">#</span>
                          <p className="font-semibold text-[#0e1724]">{item.skill}</p>
                        </div>
                        <p className="text-xs">{item.count} open job{item.count === 1 ? "" : "s"}</p>
                      </Link>
                      {index < trendingSkills.length - 1 && (
                        <div className="px-2">
                          <div className="h-px bg-[#eef2f7]" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-[#0e1724]">Who to follow</h3>
              <div className="mt-3 space-y-3 text-sm text-[#5e6d80]">
                {suggestionsToShow.length === 0 ? (
                  <p className="text-xs text-[#97a4b3]">More people to follow soon.</p>
                ) : (
                  suggestionsToShow.map((suggestion) => (
                    <div key={suggestion.clerkUserId} className="flex items-center justify-between gap-3">
                      <Link href={`/profile/${suggestion.clerkUserId}`} className="flex items-center gap-3">
                        {suggestion.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={suggestion.avatarUrl}
                            alt={suggestion.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d7cf2] text-xs font-bold text-white">
                            {suggestion.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#0e1724]">{suggestion.name}</p>
                          <p className="text-xs text-[#97a4b3]">{suggestion.followersCount} followers</p>
                        </div>
                      </Link>
                      <FollowButton
                        targetUserId={suggestion.clerkUserId}
                        initialIsFollowing={myFollowingIds.includes(suggestion.clerkUserId)}
                      />
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
