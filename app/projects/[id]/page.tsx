import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectById, getProjectProposals, hasUserProposed } from "@/lib/actions/project";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import ProjectHeaderActions from "./ProjectHeaderActions";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function timeAgo(dateValue: string | Date) {
  const now = new Date();
  const date = new Date(dateValue);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
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
  await connectDB();
  const [clientProfile, clientProjectCount] = await Promise.all([
    User.findOne({ clerkUserId: project.clientClerkId })
      .select("firstName lastName avatarUrl title hashtag city country createdAt")
      .lean(),
    Project.countDocuments({ clientClerkId: project.clientClerkId }),
  ]);

  const client = clientProfile ? JSON.parse(JSON.stringify(clientProfile)) : null;
  const latestProposal = [...proposals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const budgetLabel = project.budgetType === "hourly" ? "Hourly Rate" : "Fixed Price";
  const projectComplexityLabel = project.complexity ?? "intermediate";
  const postedAgo = new Date(project.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const estimatedTimeLabel = latestProposal?.estimatedDurationValue && latestProposal?.estimatedDurationUnit
    ? `${latestProposal.estimatedDurationValue} ${latestProposal.estimatedDurationUnit}`
    : "Not set";
  const startDateLabel = latestProposal?.estimatedArrivalAt
    ? new Date(latestProposal.estimatedArrivalAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Not set";
  const lastProposalLabel = latestProposal ? timeAgo(latestProposal.createdAt) : "No proposals yet";
  const clientLocation = [client?.city, client?.country].filter(Boolean).join(", ") || "Location not shared";
  const clientMemberSince = client?.createdAt
    ? new Date(client.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";
  const clientDisplayName =
    `${client?.firstName ?? project.clientName.split(" ")[0] ?? ""} ${client?.lastName ?? project.clientName.split(" ").slice(1).join(" ") ?? ""}`.trim() ||
    project.clientName;
  const attachments = [
    ...(project.imageUrls ?? []).map((url: string, index: number) => ({
      id: `img-${index}`,
      name: `Image_${index + 1}.jpg`,
      type: "image",
      url,
    })),
    ...(project.videoUrls ?? []).map((url: string, index: number) => ({
      id: `vid-${index}`,
      name: `Video_${index + 1}.mp4`,
      type: "video",
      url,
    })),
    ...(project.audioUrls ?? []).map((url: string, index: number) => ({
      id: `aud-${index}`,
      name: `Audio_${index + 1}.mp3`,
      type: "audio",
      url,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/projects" className="inline-flex items-center gap-2 text-xs font-semibold text-[#5e6d80] hover:text-[#0d7cf2]">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Browse Projects
        </Link>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-[#0e1724] sm:text-3xl">
                {project.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#97a4b3]">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  {project.location || "Location not set"}
                </span>
                <span>·</span>
                <span>Posted {postedAgo}</span>
                <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] font-semibold text-[#5e6d80]">
                  {project.status === "open" ? "Open for Proposals" : project.status === "in-progress" ? "In Progress" : "Closed"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProjectHeaderActions projectId={id} title={project.title} />
              {!isOwner && project.status === "open" && (
                <Link
                  href={`/projects/${id}/apply`}
                  className="rounded-lg bg-[#0d7cf2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0b6ad4]"
                >
                  {alreadyProposed ? "Applied" : "Apply Now"}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-bold text-[#0e1724]">Project Description</h3>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#5e6d80]">
                  {project.description.split("\n").map((line: string, index: number) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-bold text-[#0e1724]">Skills &amp; Expertise</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.skills.map((skill: string) => (
                    <span key={skill} className="rounded-full border border-[#b8d5ff] bg-[#e9f2ff] px-3 py-1 text-[11px] font-semibold text-[#0d7cf2]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-[#0e1724]">Attachments ({attachments.length})</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-xs text-[#5e6d80] hover:border-[#0d7cf2]/40"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f6ff] text-[#0d7cf2]">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0 0V8m0 4h4m-4 0H8m12-4H4" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#0e1724]">{file.name}</p>
                          <p className="text-[10px] text-[#97a4b3]">{file.type.toUpperCase()}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-bold text-[#0e1724]">Security &amp; Safety</h3>
                <div className="mt-3 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs text-[#5e6d80]">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e9f2ff] text-[#0d7cf2]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0e1724]">Mistri Pro Payment Protection</p>
                      <p className="mt-1 text-xs text-[#97a4b3]">
                        Always use the platform to communicate and release payments. Our escrow service protects your funds until milestones are completed and approved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase text-[#97a4b3]">Estimated Budget</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f2ff] text-[#0d7cf2]">$
                  </span>
                  <div>
                    <p className="text-lg font-bold text-[#0e1724]">Rs. {project.budgetAmount.toLocaleString()}</p>
                    <p className="text-xs text-[#97a4b3]">{budgetLabel} · {projectComplexityLabel[0].toUpperCase()}{projectComplexityLabel.slice(1)} Level</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#5e6d80]">
                  <div>
                    <p className="text-[11px] uppercase text-[#97a4b3]">Complexity</p>
                    <p className="mt-1 font-semibold text-[#0e1724] capitalize">{projectComplexityLabel}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-[#97a4b3]">Estimated Time</p>
                    <p className="mt-1 font-semibold text-[#0e1724]">{estimatedTimeLabel}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase text-[#97a4b3]">About the Client</p>
                <div className="mt-3 flex items-center gap-3">
                  {client?.avatarUrl || project.clientAvatar ? (
                    <img src={client?.avatarUrl || project.clientAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                      {clientDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0e1724]">{clientDisplayName}</p>
                    <p className="text-xs text-[#97a4b3]">{client?.title || client?.hashtag || clientLocation}</p>
                    <p className="mt-1 text-xs text-[#97a4b3]">{clientLocation}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#97a4b3]">
                  Member since {clientMemberSince} · {clientProjectCount} Projects Posted
                </p>
                <Link
                  href={`/profile/${project.clientClerkId}`}
                  className="mt-4 block w-full rounded-lg border border-gray-200 py-2 text-center text-xs font-semibold text-[#5e6d80] hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
                >
                  View Client Profile
                </Link>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase text-[#97a4b3]">Project Activity</p>
                <div className="mt-3 space-y-3 text-xs text-[#5e6d80]">
                  <div className="flex items-center justify-between">
                    <span>Applicants</span>
                    <span className="font-semibold text-[#0e1724]">{proposals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Proposal</span>
                    <span className="font-semibold text-[#0e1724]">{lastProposalLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Start Date</span>
                    <span className="font-semibold text-[#0e1724]">{startDateLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
