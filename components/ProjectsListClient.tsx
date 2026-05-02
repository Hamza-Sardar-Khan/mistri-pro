"use client";

import Link from "next/link";
import React from "react";

interface Project {
  _id: string;
  title?: string;
  description?: string;
  budgetAmount?: number;
  budgetType?: "fixed" | "hourly";
  proposalCount?: number;
  createdAt?: string;
  status?: string;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ProjectsListClient({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {projects.map((p) => (
        <div key={p._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#0e1724] line-clamp-1">{p.title ?? "Untitled project"}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.status === 'open' ? 'bg-[#e9f2ff] text-[#0d7cf2]' : 'bg-gray-100 text-[#5e6d80]'}`}>
                  {p.status === 'open' ? 'Open' : p.status === 'in-progress' ? 'In Progress' : 'Closed'}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#97a4b3]">{timeAgo(p.createdAt)}</div>
              <p className="mt-3 text-sm text-[#5e6d80] line-clamp-2">{p.description ?? "No description"}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#5e6d80]">
                <div className="flex items-center gap-2">
                  <span className="text-xs">$ Budget</span>
                  <span className="font-semibold text-[#0e1724]">{p.budgetAmount ? `$${p.budgetAmount.toLocaleString()}` : "—"}</span>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-xs">Applicants</span>
                  <span className="rounded-full bg-[#f1f5fb] px-2 py-0.5 text-[11px] font-semibold text-[#0d7cf2]">{p.proposalCount ?? 0} Proposals</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <Link
                href={`/projects/${p._id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0d7cf2] bg-white px-4 py-2 text-sm font-semibold text-[#0d7cf2] hover:bg-[#0d7cf2] hover:text-white"
              >
                View Applicants
              </Link>
              <div className="text-sm text-[#97a4b3]">&nbsp;</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
