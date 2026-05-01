"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  createdAt: string;
  location?: string;
  category?: string;
};

export default function SavedProjectsClient() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const run = async () => {
      const raw = localStorage.getItem("mistri.bookmarks");
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      if (ids.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/projects/saved?ids=${encodeURIComponent(ids.join(","))}`);
      const data = (await response.json()) as { projects: Project[] };
      setProjects(data.projects ?? []);
      setLoading(false);
    };

    void run();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-[#5e6d80] shadow-sm">
            Loading saved projects...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0e1724]">Saved Projects</h1>
            <p className="mt-1 text-sm text-[#5e6d80]">
              {projects.length} project{projects.length === 1 ? "" : "s"} saved
            </p>
          </div>
          <Link
            href="/projects"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#0e1724] transition hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
          >
            Browse Projects
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-base font-medium text-[#5e6d80]">No saved projects yet</p>
            <p className="mt-1 text-sm text-[#97a4b3]">Use the bookmark icon on a project to save it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#0d7cf2]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#0e1724] line-clamp-1">{project.title}</h2>
                    <p className="mt-1 text-sm text-[#5e6d80] line-clamp-2">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0d7cf2]">
                      ₨{project.budgetAmount.toLocaleString()}
                      {project.budgetType === "hourly" && <span className="text-xs font-normal">/hr</span>}
                    </p>
                    <p className="text-[11px] text-[#97a4b3] capitalize">{project.budgetType}</p>
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
