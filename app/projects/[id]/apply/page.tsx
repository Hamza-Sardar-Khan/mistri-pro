import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectById, hasUserProposed } from "@/lib/actions/project";
import ApplyForm from "@/components/ApplyForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/");

  const [project, alreadyProposed] = await Promise.all([
    getProjectById(id),
    hasUserProposed(id),
  ]);

  if (!project) redirect("/dashboard");

  // Can't apply to own project
  if (project.clientClerkId === user.id) redirect(`/projects/${id}`);

  // Already proposed
  if (alreadyProposed) redirect(`/projects/${id}`);

  // Project not open
  if (project.status !== "open") redirect(`/projects/${id}`);

  return <ApplyForm projectId={id} projectTitle={project.title} />;
}
