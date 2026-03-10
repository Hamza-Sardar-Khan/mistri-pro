import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectById } from "@/lib/actions/project";
import EditProjectForm from "@/components/EditProjectForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/");

  const project = await getProjectById(id);
  if (!project) redirect("/projects/mine");
  if (project.clientClerkId !== user.id) redirect("/dashboard");

  return <EditProjectForm projectId={id} />;
}
