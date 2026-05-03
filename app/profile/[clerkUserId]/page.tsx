import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFollowState, getFollowStats, getUserProfile } from "@/lib/actions/user";
import { getReceivedReviews, getUserReviewStats } from "@/lib/actions/review";
import MessageButton from "./MessageButton";
import FollowButton from "@/components/FollowButton";
import { Link } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clerkUserId: string }>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

type ReviewItem = {
  _id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  projectTitle: string;
  role: "client-to-worker" | "worker-to-client";
  createdAt: string;
};

export default async function Page({ params }: Props) {
  const { clerkUserId } = await params;
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.id === clerkUserId) redirect("/profile");

  const profile = await getUserProfile(clerkUserId);
  if (!profile || !profile.profileComplete) redirect("/dashboard");

  const [reviews, stats, followStats, followState] = await Promise.all([
    getReceivedReviews(clerkUserId),
    getUserReviewStats(clerkUserId),
    getFollowStats(clerkUserId),
    getFollowState(clerkUserId),
  ]);

  const typedReviews = reviews as ReviewItem[];
  const sellerReviews = typedReviews.filter((review) => review.role === "client-to-worker");
  const avgRating = stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : "New";

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-[1000px] px-4 py-8">
        
        {/* Header Section */}
        <div className="mb-6 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          {/* Cover Banner */}
          <div className="h-44 bg-gradient-to-r from-[#0d7cf2] via-[#3b93f7] to-[#0d7cf2]" />

          <div className="relative px-8 pb-8">
            <div className="-mt-4 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              
              {/* Avatar & User Details */}
              <div className="flex w-full flex-col items-start gap-5 md:flex-row md:items-end">
                <div className="relative shrink-0">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.firstName}
                      className="h-32 w-32 rounded-full bg-white object-cover shadow-sm ring-[6px] ring-white"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#0d7cf2] text-4xl font-bold text-white shadow-sm ring-[6px] ring-white">
                      {profile.firstName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {/* Verified Badge */}
                  <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-500">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 pb-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-3">
                    <h1 className="text-[22px] font-bold leading-none text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5">
                      <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[13px] font-semibold text-gray-700">{avgRating}</span>
                      <span className="text-[13px] text-gray-500">({stats.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <p className="mb-1 text-[15px] font-medium text-[#0d7cf2]">
                    @{profile.username || `${profile.firstName.toLowerCase()}${profile.lastName.toLowerCase()}`}
                  </p>
                  <p className="flex items-center gap-1.5 text-[14px] text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.title || "Professional"}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-gray-500">{followStats.followersCount} followers</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full items-center gap-3 md:w-auto">
                <MessageButton userId={clerkUserId} />
                 <button
                    className="w-30 h-10 flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg bg-[#0d7cf2] px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-600 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Hire
                </button>

                
                <FollowButton targetUserId={clerkUserId} initialIsFollowing={followState.isFollowing} />

              </div>

              
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mb-8 grid grid-cols-2 divide-x divide-y divide-gray-200/60 rounded-[20px] border border-gray-100 bg-[#fafafa] shadow-sm md:grid-cols-4 md:divide-y-0">
          <div className="flex flex-col items-center justify-center p-5 text-center">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              HOURLY RATE
            </div>
            <p className="text-[17px] font-bold text-gray-900">
              {profile.hourlyRate > 0 ? `₨${profile.hourlyRate}` : "Negotiable"}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-5 text-center">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              LOCATION
            </div>
            <p className="text-[15px] font-bold text-gray-900">
              {profile.city || "Global"}{profile.city && profile.country ? `, ${profile.country}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-5 text-center">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              JOBS DONE
            </div>
            <p className="text-[17px] font-bold text-gray-900">{stats.completedJobs || 0}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-5 text-center">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              MEMBER SINCE
            </div>
            <p className="text-[15px] font-bold text-gray-900">
              {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Main Left Column */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* About Me */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-gray-900">
                <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                About Me
              </h2>
              <div className="space-y-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-600">
                {profile.bio ? (
                  <p>{profile.bio}</p>
                ) : (
                  <p>No bio added yet.</p>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Experience (If exists) */}
            {profile.experience && (
              <>
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-gray-900">
                    <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Work Experience
                  </h2>
                  <div className="space-y-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-600">
                    <p>{profile.experience}</p>
                  </div>
                </section>
                <hr className="border-gray-100" />
              </>
            )}

            {/* Client Reviews */}
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[18px] font-bold text-gray-900">
                  <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Client Reviews
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-gray-600">
                  {stats.sellerReviewCount} Reviews
                </span>
              </div>

              <div className="space-y-6">
                {sellerReviews.length === 0 ? (
                  <p className="text-sm italic text-gray-500">No reviews yet.</p>
                ) : (
                  sellerReviews.map((review, index) => (
                    <div key={review._id}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {review.reviewerAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={review.reviewerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-500">
                              {review.reviewerName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{review.reviewerName}</p>
                            <p className="text-[12px] text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                month: "long", day: "numeric", year: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      
                      <div className="mt-3">
                        <span className="mb-2 inline-block rounded-full bg-[#f0f7ff] px-2.5 py-1 text-[11px] font-semibold text-[#3b82f6]">
                          Project: {review.projectTitle}
                        </span>
                        <p className="italic text-[14px] text-gray-600">"{review.comment}"</p>
                      </div>

                      {index !== sellerReviews.length - 1 && (
                        <hr className="mt-6 border-gray-100" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Expertise & Skills */}
            <div className="rounded-[20px] border border-gray-100 bg-[#fafbfc] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-gray-900">
                <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Expertise & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#f0f7ff] px-3 py-1.5 text-[12px] font-semibold tracking-wide text-[#4281cf]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No skills listed</span>
                )}
              </div>
            </div>

            {/* Education */}
            {profile.education && (
              <div className="rounded-[20px] border border-gray-100 bg-[#fafbfc] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-gray-900">
                  <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Education
                </h3>
                <div className="text-[14px] text-gray-700">
                  <p>{profile.education}</p>
                </div>
              </div>
            )}

            {/* Badges/Hashtags */}
            {profile.hashtag && (
              <div className="rounded-[20px] border border-gray-100 bg-[#fafbfc] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-gray-900">
                  <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Profile Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-700">
                    {profile.hashtag}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}