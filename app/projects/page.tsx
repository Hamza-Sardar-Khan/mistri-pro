import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/actions/project";
import BrowseProjectsClient from "./BrowseProjectsClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; skill?: string; q?: string }>;
}

export default async function BrowseProjectsPage({ searchParams }: Props) {
  const user = await currentUser();
  if (!user) redirect("/");

  const params = await searchParams;
  const projects = await getProjects();

  return (
    <BrowseProjectsClient
      projects={projects}
      initialCategory={params.category ?? params.skill ?? ""}
      initialSearch={params.q ?? ""}
    />
  );
}
