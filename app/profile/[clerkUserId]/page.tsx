import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/actions/user";
import MessageButton from "./MessageButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clerkUserId: string }>;
}

export default async function Page({ params }: Props) {
  const { clerkUserId } = await params;
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.id === clerkUserId) redirect("/profile");

  const profile = await getUserProfile(clerkUserId);
  if (!profile || !profile.profileComplete) redirect("/dashboard");

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
                  Skills
                </p>
                <p className="text-lg font-bold text-[#0e1724]">{profile.skills?.length ?? 0}</p>
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
