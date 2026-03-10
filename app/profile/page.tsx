import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Placeholder reviews for UI
const MOCK_REVIEWS = [
  {
    id: "1",
    name: "Ahmed Khan",
    avatar: "",
    rating: 5,
    text: "Excellent work! Fixed all the electrical issues in my house within a day. Very professional and punctual. Highly recommended.",
    date: "2 weeks ago",
    project: "Home Electrical Repair",
  },
  {
    id: "2",
    name: "Sara Malik",
    avatar: "",
    rating: 4,
    text: "Good quality work. Showed up on time and completed the job as described. Will hire again for future projects.",
    date: "1 month ago",
    project: "Office Wiring Installation",
  },
  {
    id: "3",
    name: "Usman Ali",
    avatar: "",
    rating: 5,
    text: "Outstanding craftsmanship. Went above and beyond to make sure everything was perfect. Very fair pricing too.",
    date: "2 months ago",
    project: "Kitchen Renovation",
  },
];

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

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const profile = await getMyProfile();
  if (!profile || !profile.profileComplete) redirect("/profile-setup");

  const avgRating = (
    MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Profile Hero Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover gradient */}
          <div className="h-36 bg-gradient-to-r from-[#0d7cf2] via-[#3b93f7] to-[#0d7cf2]" />

          <div className="px-6 sm:px-8 pb-6">
            {/* Avatar + Core Info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
              <div className="shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.firstName}
                    loading="eager"
                    decoding="async"
                    className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-[#0d7cf2] ring-4 ring-white shadow-lg flex items-center justify-center text-3xl font-bold text-white">
                    {profile.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 sm:pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0e1724]">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-sm font-medium text-[#0d7cf2]">{profile.hashtag}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-bold text-yellow-700">{avgRating}</span>
                      <span className="text-xs text-yellow-600">({MOCK_REVIEWS.length} reviews)</span>
                    </div>
                  </div>
                </div>
                <p className="text-base text-[#5e6d80] mt-1">{profile.title}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-[#97a4b3] mb-0.5">Hourly Rate</p>
                <p className="text-lg font-bold text-[#0e1724]">
                  {profile.hourlyRate > 0 ? `₨${profile.hourlyRate}` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-[#97a4b3] mb-0.5">Location</p>
                <p className="text-sm font-semibold text-[#0e1724] truncate">
                  {profile.city || "—"}{profile.city && profile.country ? `, ${profile.country}` : ""}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-[#97a4b3] mb-0.5">Jobs Done</p>
                <p className="text-lg font-bold text-[#0e1724]">12</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-[#97a4b3] mb-0.5">Member Since</p>
                <p className="text-sm font-semibold text-[#0e1724]">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About / Bio */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#0e1724] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                About Me
              </h3>
              <p className="text-sm text-[#5e6d80] leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio added yet."}
              </p>
            </div>

            {/* Experience */}
            {profile.experience && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#0e1724] mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Work Experience
                </h3>
                <p className="text-sm text-[#5e6d80] leading-relaxed whitespace-pre-wrap">
                  {profile.experience}
                </p>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0e1724] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Client Reviews
                </h3>
                <span className="text-xs font-medium text-[#97a4b3]">{MOCK_REVIEWS.length} reviews</span>
              </div>

              <div className="space-y-4">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0d7cf2] to-[#3b93f7] flex items-center justify-center text-white text-sm font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0e1724]">{review.name}</p>
                          <p className="text-xs text-[#97a4b3]">{review.date}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-xs font-medium text-[#0d7cf2] mb-1.5">Project: {review.project}</p>
                    <p className="text-sm text-[#5e6d80] leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#0e1724] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill: string) => {
                  const icons: Record<string, string> = {
                    Electrician: "⚡", Plumber: "🔧", Carpenter: "🪚", Painter: "🎨",
                    Mason: "🧱", Welder: "🔥", "HVAC Technician": "❄️", Roofer: "🏠",
                    Tiler: "🔲", Landscaper: "🌿",
                  };
                  return (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0d7cf2]/10 text-[#0d7cf2] px-3 py-1.5 text-xs font-medium"
                    >
                      <span>{icons[skill] || "🛠️"}</span>
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Education */}
            {profile.education && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#0e1724] mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                  Education
                </h3>
                <p className="text-sm text-[#5e6d80] leading-relaxed">{profile.education}</p>
              </div>
            )}

            {/* Languages */}
            {profile.languages?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#0e1724] mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Languages
                </h3>
                <div className="space-y-2">
                  {profile.languages.map((lang: string) => (
                    <div key={lang} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#0d7cf2]" />
                      <span className="text-sm text-[#5e6d80]">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#0e1724] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </h3>
              <div className="space-y-3">
                {profile.phone && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-[#5e6d80]">{profile.phone}</span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-[#5e6d80]">{profile.city}, {profile.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Badge  */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">Verified Professional</p>
                  <p className="text-xs text-green-600">Identity & skills verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
