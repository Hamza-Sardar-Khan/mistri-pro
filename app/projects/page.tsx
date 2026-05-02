import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/actions/project";
import BrowseProjectsClient from "./BrowseProjectsClient";

export const dynamic = "force-dynamic";

export default async function BrowseProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const projects = await getProjects();

  return <BrowseProjectsClient projects={projects} />;
}
