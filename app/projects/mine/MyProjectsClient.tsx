"use client";

import { useMemo, useState } from "react";
import ProjectsListClient from "@/components/ProjectsListClient";

type ProjectStatus = "open" | "in-progress" | "closed";
type Tab = "open" | "in-progress" | "closed" | "all";

interface Project {
  _id: string;
  title?: string;
  description?: string;
  budgetAmount?: number;
  budgetType?: "fixed" | "hourly";
  proposalCount?: number;
  createdAt?: string;
  status?: ProjectStatus;
}

interface Props {
  projects: Project[];
}

const tabs: { value: Tab; label: string }[] = [
  { value: "open", label: "Open Projects" },
  { value: "in-progress", label: "Active Posted Projects" },
  { value: "closed", label: "Completed Posted Projects" },
  { value: "all", label: "All Posted Projects" },
];

export default function MyProjectsClient({ projects }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("open");

  const counts = useMemo(
    () => ({
      open: projects.filter((project) => project.status === "open").length,
      "in-progress": projects.filter((project) => project.status === "in-progress").length,
      closed: projects.filter((project) => project.status === "closed").length,
      all: projects.length,
    }),
    [projects]
  );

  const visibleProjects = useMemo(() => {
    if (activeTab === "all") return projects;
    return projects.filter((project) => project.status === activeTab);
  }, [activeTab, projects]);

  return (
    <div className="mt-6 rounded-2xl bg-white p-4">
      <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`border-b-2 pb-3 text-sm font-semibold transition ${
                activeTab === tab.value
                  ? "border-[#0d7cf2] text-[#0e1724]"
                  : "border-transparent text-[#97a4b3] hover:text-[#0e1724]"
              }`}
            >
              {tab.label} ({counts[tab.value]})
            </button>
          ))}
        </div>
        <div className="text-sm text-[#97a4b3]">Sort by: Newest First</div>
      </div>

      <div className="mt-6">
        {visibleProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-[#97a4b3]">
            <p className="text-base font-medium">No projects in this status</p>
            <p className="mt-1 text-sm">Projects you posted will move here as their status changes.</p>
          </div>
        ) : (
          <ProjectsListClient projects={visibleProjects} />
        )}
      </div>
    </div>
  );
}
