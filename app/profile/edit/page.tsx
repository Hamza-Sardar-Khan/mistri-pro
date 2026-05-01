import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/user";
import ProfileSetupForm from "@/components/ProfileSetupForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const profile = await getMyProfile();
  if (!profile) redirect("/profile-setup");

  return (
    <ProfileSetupForm
      mode="edit"
      initialData={{
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      }}
      initialProfile={{
        title: profile.title ?? "",
        bio: profile.bio ?? "",
        hourlyRate: profile.hourlyRate ?? 0,
        phone: profile.phone ?? "",
        city: profile.city ?? "",
        country: profile.country ?? "",
        skills: profile.skills ?? [],
        education: profile.education ?? "",
        experience: profile.experience ?? "",
        languages: profile.languages ?? [],
      }}
    />
  );
}
