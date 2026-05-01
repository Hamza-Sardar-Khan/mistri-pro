import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SavedProjectsClient from "./SavedProjectsClient";

export const dynamic = "force-dynamic";

export default async function SavedProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return <SavedProjectsClient />;
}
