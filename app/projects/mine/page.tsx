import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyContracts, getMyProjects } from "@/lib/actions/project";
import Link from "next/link";
import MyProjectsClient from "./MyProjectsClient";

export const dynamic = "force-dynamic";

interface MyProject {
  _id: string;
  status: "open" | "in-progress" | "closed";
  budgetAmount?: number;
  proposalCount?: number;
}

interface MyContract {
  agreedAmount: number;
  paymentStatus: "deposited" | "released";
  currentUserRole: "client" | "worker";
}

export default async function MyPostedProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const [projects, contracts] = await Promise.all([
    getMyProjects() as Promise<MyProject[]>,
    getMyContracts() as Promise<MyContract[]>,
  ]);

  const openCount = projects.filter((project) => project.status === "open").length;
  const activeCount = projects.filter((project) => project.status === "in-progress").length;
  const totalApplicants = projects.reduce((sum, project) => sum + (project.proposalCount ?? 0), 0);
  const budgetSpent = contracts
    .filter((contract) => contract.currentUserRole === "client" && contract.paymentStatus === "released")
    .reduce((sum, contract) => sum + contract.agreedAmount, 0);

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
            <p className="mt-1 text-xs text-[#97a4b3]">Currently accepting proposals</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Active Contracts</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">{activeCount}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">&nbsp;</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Total Applicants</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">{totalApplicants}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">Across your posted projects</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-[#97a4b3]">Budget Spent</p>
            <p className="mt-2 text-2xl font-bold text-[#0e1724]">₨{budgetSpent.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">Released dummy payments</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-[#97a4b3]">
            <p className="text-base font-medium">You have not posted any projects yet</p>
            <p className="mt-1 text-sm">Post your first project to find skilled professionals</p>
            <Link
              href="/projects/post"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0d7cf2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b6ad4]"
            >
              Post a Project
            </Link>
          </div>
        ) : (
          <MyProjectsClient projects={projects} />
        )}
      </main>
    </div>
  );
}
