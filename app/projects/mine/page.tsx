import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyProjects } from "@/lib/actions/project";
import Link from "next/link";
import ProjectActions from "@/components/ProjectActions";

export const dynamic = "force-dynamic";

export default async function MyPostedProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const projects = await getMyProjects();

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0e1724]">My Posted Projects</h2>
            <p className="text-sm text-[#97a4b3] mt-0.5">
              {projects.length} project{projects.length !== 1 ? "s" : ""} posted
            </p>
          </div>
          <Link
            href="/projects/post"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-[#97a4b3] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-base font-medium text-[#5e6d80]">You haven&apos;t posted any projects yet</p>
            <p className="mt-1 text-sm text-[#97a4b3]">Post your first project to find skilled professionals</p>
            <Link
              href="/projects/post"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0d7cf2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
            >
              Post a Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project: Record<string, unknown>) => (
              <Link
                key={project._id as string}
                href={`/projects/${project._id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#0d7cf2]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-base font-semibold text-[#0e1724] line-clamp-1">
                      {project.title as string}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#97a4b3]">
                        {new Date(project.createdAt as string).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-[#97a4b3]">·</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        project.status === "open"
                          ? "bg-green-50 text-green-700"
                          : project.status === "in-progress"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {(project.status as string).replace("-", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-[#0d7cf2]">
                      ₨{(project.budgetAmount as number).toLocaleString()}
                      {project.budgetType === "hourly" && <span className="text-xs font-normal">/hr</span>}
                    </p>
                    <p className="text-[11px] text-[#97a4b3] capitalize">{project.budgetType as string}</p>
                  </div>
                </div>

                <p className="text-sm text-[#5e6d80] line-clamp-2 mb-3">
                  {project.description as string}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {(project.skills as string[]).map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#0d7cf2]/10 px-2.5 py-0.5 text-xs font-medium text-[#0d7cf2]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="text-sm font-semibold text-[#0e1724]">
                        {project.proposalCount as number}
                      </span>
                      <span className="text-xs text-[#97a4b3]">
                        proposal{(project.proposalCount as number) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <ProjectActions projectId={project._id as string} projectTitle={project.title as string} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
