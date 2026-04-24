import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectById, getProjectProposals, hasUserProposed } from "@/lib/actions/project";
import ProposalsList from "./ProposalsList";
import Link from "next/link";
import ProjectActions from "@/components/ProjectActions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/");

  const [project, proposals, alreadyProposed] = await Promise.all([
    getProjectById(id),
    getProjectProposals(id),
    hasUserProposed(id),
  ]);

  if (!project) redirect("/dashboard");

  const isOwner = project.clientClerkId === user.id;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Project details card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
          {/* Status badge */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              project.status === "open"
                ? "bg-green-50 text-green-700 border border-green-200"
                : project.status === "in-progress"
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}>
              {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Closed"}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#97a4b3]">
                {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {isOwner && <ProjectActions projectId={id} projectTitle={project.title} />}
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-[#0e1724] mb-2">{project.title}</h2>

          {/* Client info */}
          <div className="flex items-center gap-3 mb-5">
            {project.clientAvatar ? (
              <img src={project.clientAvatar} alt="" loading="lazy" decoding="async" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d7cf2] text-xs font-bold text-white">
                {project.clientName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-[#5e6d80]">{project.clientName}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-[#2d3a4a] leading-relaxed whitespace-pre-wrap mb-6">{project.description}</p>

          {/* Budget and skills */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-[#97a4b3] mb-0.5">Budget</p>
              <p className="text-lg font-bold text-[#0e1724]">
                ₨{project.budgetAmount.toLocaleString()}
                {project.budgetType === "hourly" && <span className="text-sm font-normal text-[#97a4b3]">/hr</span>}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-[#97a4b3] mb-0.5">Proposals</p>
              <p className="text-lg font-bold text-[#0e1724]">{proposals.length}</p>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <p className="text-xs font-medium text-[#97a4b3] mb-2">Skills Required</p>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill: string) => (
                <span key={skill} className="rounded-full bg-[#0d7cf2]/10 text-[#0d7cf2] px-3 py-1.5 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Media */}
          {project.imageUrls?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[#97a4b3] mb-2">Images</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {project.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="" loading="lazy" decoding="async" className="rounded-lg w-full h-40 object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          {project.videoUrls?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[#97a4b3] mb-2">Videos</p>
              <div className="space-y-2">
                {project.videoUrls.map((url: string, i: number) => (
                  <video key={i} src={url} controls preload="none" className="w-full rounded-lg border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          {project.audioUrls?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[#97a4b3] mb-2">Audio Files</p>
              <div className="space-y-2">
                {project.audioUrls.map((url: string, i: number) => (
                  <audio key={i} src={url} controls preload="none" className="w-full" />
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {!isOwner && project.status === "open" && (
            <div className="mt-6">
              {alreadyProposed ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-sm font-medium text-green-700">✓ You have already submitted a proposal</p>
                </div>
              ) : (
                <Link
                  href={`/projects/${id}/apply`}
                  className="block w-full rounded-lg bg-[#0d7cf2] py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
                >
                  Submit a Proposal
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Proposals section */}
        <ProposalsList projectId={id} proposals={proposals} isOwner={isOwner} currentUserId={user.id} />
      </main>
    </div>
  );
}
