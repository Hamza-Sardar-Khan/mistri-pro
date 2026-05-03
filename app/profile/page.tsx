import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFollowStats, getMyProfile } from "@/lib/actions/user";
import { getReceivedReviews, getUserReviewStats } from "@/lib/actions/review";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";

export const dynamic = "force-dynamic";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
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

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const profile = await getMyProfile();
  if (!profile || !profile.profileComplete) redirect("/profile-setup");

  const [reviews, stats, followStats] = await Promise.all([
    getReceivedReviews(user.id),
    getUserReviewStats(user.id),
    getFollowStats(user.id),
  ]);

  const typedReviews = reviews as ReviewItem[];
  const sellerReviews = typedReviews.filter((review) => review.role === "client-to-worker");
  const avgRating = stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : "New";

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-[1000px] px-4 py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
          {/* Cover Banner */}
          <div className="h-44 bg-[#5eb6ff]" />

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-10">
              
              {/* Avatar & User Details */}
              <div className="flex flex-col md:flex-row gap-5 items-start md:items-end w-full">
                <div className="relative shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.firstName}
                      className="w-32 h-32 rounded-full object-cover ring-[6px] ring-white shadow-sm bg-white"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full ring-[6px] ring-white bg-[#0d7cf2] flex items-center justify-center text-4xl font-bold text-white shadow-sm">
                      {profile.firstName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {/* Verified Badge */}
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    <h1 className="text-[22px] font-bold text-gray-900 leading-none">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5">
                      <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[13px] font-semibold text-gray-700">{avgRating}</span>
                      <span className="text-[13px] text-gray-500">({stats.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <p className="text-[15px] text-[#0d7cf2] font-medium mb-1">
                    @{profile.username || `${profile.firstName.toLowerCase()}${profile.lastName.toLowerCase()}`}
                  </p>
                  <p className="text-[14px] text-gray-500 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.title || "Professional Consultant"}
                  </p>
                </div>
              </div>

            
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-100 bg-[#fafafa] rounded-[20px] mb-8 divide-x divide-gray-200/60 divide-y md:divide-y-0 shadow-sm">
          <div className="p-5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              HOURLY RATE
            </div>
            <p className="text-[17px] font-bold text-gray-900">
              {profile.hourlyRate > 0 ? `$${profile.hourlyRate}` : "Negotiable"}
            </p>
          </div>
          <div className="p-5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              LOCATION
            </div>
            <p className="text-[15px] font-bold text-gray-900">
              {profile.city || "Global"}{profile.city && profile.country ? `, ${profile.country}` : ""}
            </p>
          </div>
          <div className="p-5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              JOBS DONE
            </div>
            <p className="text-[17px] font-bold text-gray-900">{stats.completedJobs || 0}</p>
          </div>
          <div className="p-5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              MEMBER SINCE
            </div>
            <p className="text-[15px] font-bold text-gray-900">
              {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Me */}
            <section>
              <h2 className="text-[18px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                About Me
              </h2>
              <div className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap space-y-4">
                {profile.bio ? (
                  <p>{profile.bio}</p>
                ) : (
                  <p>Professional consultant with years of experience. I combine traditional craftsmanship with modern tools to provide clients with optimal results...</p>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Client Reviews */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Client Reviews
                </h2>
                <span className="bg-gray-100 text-gray-600 text-[12px] font-medium px-3 py-1 rounded-full">
                  {stats.sellerReviewCount} Reviews
                </span>
              </div>

              <div className="space-y-6">
                {sellerReviews.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No reviews yet.</p>
                ) : (
                  sellerReviews.map((review, index) => (
                    <div key={review._id}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {review.reviewerAvatar ? (
                            <img src={review.reviewerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
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
                        <span className="inline-block bg-[#f0f7ff] text-[#3b82f6] text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2">
                          Project: {review.projectTitle}
                        </span>
                        <p className="text-[14px] text-gray-600 italic">"{review.comment}"</p>
                      </div>

                      {index !== sellerReviews.length - 1 && (
                        <hr className="border-gray-100 mt-6" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {sellerReviews.length > 0 && (
                <div className="mt-8 text-center">
                  <button className="text-[14px] font-semibold text-[#0d7cf2] hover:underline">
                    View All Reviews
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Expertise & Skills */}
            <div className="bg-[#fafbfc] rounded-[20px] p-6 border border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Expertise & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="bg-[#f0f7ff] text-[#4281cf] px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wide"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No skills listed</span>
                )}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-[#fafbfc] rounded-[20px] p-6 border border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Languages
              </h3>
              <div className="space-y-3">
                {profile.languages?.length > 0 ? (
                  profile.languages.map((lang: string, index: number) => {
                    // Simulating language proficiency badges as per image design
                    const proficiencies = ["Native", "Fluent", "Basic"];
                    const proficiency = proficiencies[index % proficiencies.length];

                    return (
                      <div key={lang} className="flex items-center justify-between">
                        <span className="text-[14px] font-medium text-gray-700">{lang}</span>
                        <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                          {proficiency}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-500">English</span>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-[#fafbfc] rounded-[20px] p-6 border border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[14px] text-gray-600 break-all">{profile.email || "h.kareem@mistripro.com"}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-[14px] text-gray-600">{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  <a href="#" className="text-[14px] text-[#3b82f6] hover:underline break-all">portfolio.{profile.username || "dev"}</a>
                </div>
              </div>

              <button className="w-full bg-[#00f2fe] hover:bg-[#00dcf0] transition text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm text-[14.5px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Connect Professionally
              </button>
            </div>

          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}