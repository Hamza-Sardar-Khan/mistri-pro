import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyProjects } from "@/lib/actions/project";
import Link from "next/link";
import ProjectsListClient from "@/components/ProjectsListClient";

export const dynamic = "force-dynamic";

export default async function MyPostedProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const projects = await getMyProjects();

  const openCount = projects.filter((p: any) => p.status === "open").length;
  const activeCount = projects.filter((p: any) => p.status === "in-progress").length;
  const totalApplicants = projects.reduce((sum: number, p: any) => sum + (p.proposalCount ?? 0), 0);
  const budgetSpent = projects.reduce((sum: number, p: any) => sum + (p.budgetAmount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0e1724]">Project Management</h1>
            <p className="mt-1 text-sm text-[#5e6d80]">Manage your posted listings, track ongoing work, and review completed projects.</p>
          </div>
          <Link
            href="/projects/post"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
          >
            Post New Project
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Open Postings</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">{openCount}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">+1 from last week</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Active Contracts</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">{activeCount}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">&nbsp;</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Total Applicants</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">{totalApplicants}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">+12% conversion</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Budget Spent</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">${budgetSpent.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">&nbsp;</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <button className="border-b-2 border-[#0d7cf2] pb-3 text-sm font-semibold text-[#0e1724]">Open Projects</button>
              <button className="text-sm text-[#97a4b3]">Active Work</button>
              <button className="text-sm text-[#97a4b3]">Completed</button>
            </div>
            <div className="text-sm text-[#97a4b3]">Sort by: Newest First</div>
          </div>

          <div className="mt-6">
            {projects.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-[#97a4b3]">
                <p className="text-base font-medium">You haven't posted any projects yet</p>
                <p className="mt-1 text-sm">Post your first project to find skilled professionals</p>
                <Link
                  href="/projects/post"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0d7cf2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
                >
                  Post a Project
                </Link>
              </div>
            ) : (
              <div className="mt-2">
                <ProjectsListClient projects={projects} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
