import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/actions/user";
import { getReceivedReviews, getUserReviewStats } from "@/lib/actions/review";
import MessageButton from "./MessageButton";

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
  rating: number;
  comment: string;
  projectTitle: string;
  role: "client-to-worker" | "worker-to-client";
  createdAt: string;
};

function ReviewSection({
  title,
  description,
  reviews,
}: {
  title: string;
  description: string;
  reviews: ReviewItem[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-[#0e1724]">{title}</h4>
        <p className="mt-0.5 text-xs text-[#97a4b3]">{description}</p>
      </div>
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 text-center text-sm text-[#97a4b3]">
          No reviews in this category yet.
        </div>
      ) : (
        reviews.map((review) => (
          <div key={review._id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0e1724]">{review.reviewerName}</p>
                <p className="text-xs text-[#97a4b3]">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="mb-1.5 text-xs font-medium text-[#0d7cf2]">Project: {review.projectTitle}</p>
            <p className="text-sm leading-relaxed text-[#5e6d80]">{review.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default async function Page({ params }: Props) {
  const { clerkUserId } = await params;
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.id === clerkUserId) redirect("/profile");

  const profile = await getUserProfile(clerkUserId);
  if (!profile || !profile.profileComplete) redirect("/dashboard");
  const [reviews, stats] = await Promise.all([
    getReceivedReviews(clerkUserId),
    getUserReviewStats(clerkUserId),
  ]);
  const typedReviews = reviews as ReviewItem[];
  const sellerReviews = typedReviews.filter((review) => review.role === "client-to-worker");
  const clientReviews = typedReviews.filter((review) => review.role === "worker-to-client");
  const ratingLabel = stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : "New";

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-36 bg-gradient-to-r from-[#0d7cf2] via-[#3b93f7] to-[#0d7cf2]" />

          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="shrink-0">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.firstName}
                    loading="eager"
                    decoding="async"
                    className="h-28 w-28 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[#0d7cf2] text-3xl font-bold text-white shadow-lg ring-4 ring-white">
                    {profile.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 sm:pb-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0e1724]">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-sm font-medium text-[#0d7cf2]">{profile.hashtag}</p>
                    <p className="mt-1 text-base text-[#5e6d80]">{profile.title}</p>
                  </div>
                  <MessageButton userId={clerkUserId} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="mb-0.5 inline-flex items-center gap-1 text-xs text-[#97a4b3]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8c-2.21 0-4 1.79-4 4m4-4c2.21 0 4 1.79 4 4m-4-4V6m0 12v-2m7-4h-2M7 12H5" />
                  </svg>
                  Hourly Rate
                </p>
                <p className="text-lg font-bold text-[#0e1724]">
                  {profile.hourlyRate > 0 ? `₨${profile.hourlyRate}` : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="mb-0.5 inline-flex items-center gap-1 text-xs text-[#97a4b3]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21s6-5.373 6-10a6 6 0 10-12 0c0 4.627 6 10 6 10z" />
                    <circle cx="12" cy="11" r="2.5" strokeWidth={1.6} />
                  </svg>
                  Location
                </p>
                <p className="truncate text-sm font-semibold text-[#0e1724]">
                  {profile.city || "-"}{profile.city && profile.country ? `, ${profile.country}` : ""}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="mb-0.5 inline-flex items-center gap-1 text-xs text-[#97a4b3]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 3h6l1 2h4v6a7 7 0 01-14 0V5h4l1-2z" />
                  </svg>
                  Reviews
                </p>
                <p className="text-lg font-bold text-[#0e1724]">{ratingLabel}</p>
                <p className="text-[11px] text-[#97a4b3]">{stats.reviewCount} total</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="mb-0.5 inline-flex items-center gap-1 text-xs text-[#97a4b3]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 7V5m8 2V5M4 9h16M6 12h4m-4 4h3m6-4h3m-3 4h2" />
                  </svg>
                  Member Since
                </p>
                <p className="text-sm font-semibold text-[#0e1724]">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#0e1724]">
                <svg className="h-5 w-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                About
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#5e6d80]">
                {profile.bio || "No bio added yet."}
              </p>
            </div>

            {profile.experience && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-bold text-[#0e1724]">Work Experience</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#5e6d80]">
                  {profile.experience}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0e1724]">Reviews</h3>
                <span className="text-xs font-medium text-[#97a4b3]">{stats.completedJobs} jobs done</span>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-[#97a4b3]">As Seller</p>
                  <p className="mt-1 text-lg font-bold text-[#0e1724]">
                    {stats.sellerReviewCount > 0 ? stats.sellerAverageRating.toFixed(1) : "New"}
                  </p>
                  <p className="text-xs text-[#97a4b3]">{stats.sellerReviewCount} client review{stats.sellerReviewCount === 1 ? "" : "s"}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-[#97a4b3]">As Client</p>
                  <p className="mt-1 text-lg font-bold text-[#0e1724]">
                    {stats.clientReviewCount > 0 ? stats.clientAverageRating.toFixed(1) : "New"}
                  </p>
                  <p className="text-xs text-[#97a4b3]">{stats.clientReviewCount} seller review{stats.clientReviewCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="space-y-6">
                <ReviewSection
                  title="Reviews From Clients"
                  description="Feedback received for jobs completed as a seller."
                  reviews={sellerReviews}
                />
                <ReviewSection
                  title="Reviews From Sellers"
                  description="Feedback received from workers hired as a client."
                  reviews={clientReviews}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-[#0e1724]">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#0d7cf2]/10 px-3 py-1.5 text-xs font-medium text-[#0d7cf2]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-[#97a4b3]">No skills listed</p>
                )}
              </div>
            </div>

            {profile.education && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-bold text-[#0e1724]">Education</h3>
                <p className="text-sm leading-relaxed text-[#5e6d80]">{profile.education}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
