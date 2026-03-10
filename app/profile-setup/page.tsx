import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncAndCheckProfile } from "@/lib/actions/user";
import ProfileSetupForm from "@/components/ProfileSetupForm";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  // Single call: sync + check profile
  const result = await syncAndCheckProfile();
  if (!result) redirect("/");
  if (result.profileComplete) redirect("/dashboard");

  return (
    <ProfileSetupForm
      initialData={{
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        avatarUrl: user.imageUrl ?? "",
      }}
    />
  );
}
