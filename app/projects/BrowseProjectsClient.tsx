"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AVAILABLE_LOCATIONS, AVAILABLE_SKILLS } from "@/lib/constants";
import AppFooter from "@/components/AppFooter";

type BudgetType = "fixed" | "hourly";

type ProjectListItem = {
  _id: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  skills: string[];
  budgetType: BudgetType;
  budgetAmount: number;
  createdAt: string;
};

type SortOption = "newest" | "budget-high" | "budget-low";

const BUDGET_OPTIONS: { label: string; value: BudgetType }[] = [
  { label: "Fixed Price", value: "fixed" },
  { label: "Hourly Rate", value: "hourly" },
];

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`.replace("1 minutes", "1 minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`.replace("1 hours", "1 hour");
  const days = Math.floor(hours / 24);
  return `${days} days ago`.replace("1 days", "1 day");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function BrowseProjectsClient({
  projects,
}: {
  projects: ProjectListItem[];
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<BudgetType[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const locationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      if (!project.location) return;
      counts.set(project.location, (counts.get(project.location) ?? 0) + 1);
    });
    return counts;
  }, [projects]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      if (project.category) {
        counts.set(project.category, (counts.get(project.category) ?? 0) + 1);
        return;
      }
      project.skills?.forEach((skill) => {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      });
    });
    return counts;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = normalize(searchQuery);

    const matchesSearch = (project: ProjectListItem) => {
      if (!query) return true;
      const fields = [
        project.title,
        project.description,
        project.category ?? "",
        project.location ?? "",
        ...(project.skills ?? []),
      ];
      return fields.some((field) => normalize(String(field)).includes(query));
    };

    const matchesCategories = (project: ProjectListItem) => {
      if (selectedCategories.length === 0) return true;
      if (project.category && selectedCategories.includes(project.category)) return true;
      if (!project.skills || project.skills.length === 0) return false;
      return project.skills.some((skill) => selectedCategories.includes(skill));
    };

    const matchesLocations = (project: ProjectListItem) => {
      if (selectedLocations.length === 0) return true;
      if (!project.location) return false;
      return selectedLocations.includes(project.location);
    };

    const matchesBudgets = (project: ProjectListItem) => {
      if (selectedBudgets.length === 0) return true;
      return selectedBudgets.includes(project.budgetType);
    };

    const result = projects.filter(
      (project) =>
        matchesSearch(project) &&
        matchesCategories(project) &&
        matchesLocations(project) &&
        matchesBudgets(project)
    );

    const sorted = [...result];
    if (sortBy === "budget-high") {
      sorted.sort((a, b) => b.budgetAmount - a.budgetAmount);
    } else if (sortBy === "budget-low") {
      sorted.sort((a, b) => a.budgetAmount - b.budgetAmount);
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  }, [
    projects,
    searchQuery,
    selectedCategories,
    selectedLocations,
    selectedBudgets,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedLocations, selectedBudgets, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, "ellipsis", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  }, [currentPage, totalPages]);

  const clearAll = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedBudgets([]);
    setSortBy("newest");
  };

  const toggleFilterValue = (value: string, list: string[], setList: (value: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const toggleBudget = (value: BudgetType) => {
    setSelectedBudgets((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="border-b border-gray-200 bg-[#f1f5fb]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-extrabold text-[#0e1724]">Browse Projects</h1>
          <p className="mt-1 text-sm text-[#5e6d80]">
            Find the perfect project that matches your skills. Apply today and start working with top clients.
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <svg className="h-4 w-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects (e.g., Kitchen plumbing, Wiring)"
              className="flex-1 bg-transparent text-sm text-[#0e1724] placeholder:text-[#97a4b3] focus:outline-none"
              value={searchInput}
              onChange={(e) => {
                const next = e.target.value;
                setSearchInput(next);
                setSearchQuery(next);
              }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="self-start">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-5 overflow-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0e1724]">
                  <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
                  </svg>
                  Filters
                </div>
                <button className="text-xs font-semibold text-[#0d7cf2] hover:underline" onClick={clearAll}>
                  Clear all
                </button>
              </div>

              <div>
                <button className="flex w-full items-center justify-between text-sm font-semibold text-[#0e1724]">
                  Category
                  <svg className="h-4 w-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="mt-3 space-y-2 text-sm text-[#5e6d80]">
                  {AVAILABLE_SKILLS.map((item) => (
                    <label key={item} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-gray-300"
                          checked={selectedCategories.includes(item)}
                          onChange={() => toggleFilterValue(item, selectedCategories, setSelectedCategories)}
                        />
                        {item}
                      </span>
                      <span className="text-xs text-[#97a4b3]">{categoryCounts.get(item) ?? 0}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <button className="flex w-full items-center justify-between text-sm font-semibold text-[#0e1724]">
                  Budget Type
                  <svg className="h-4 w-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="mt-3 space-y-2 text-sm text-[#5e6d80]">
                  {BUDGET_OPTIONS.map((item) => (
                    <label key={item.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300"
                        checked={selectedBudgets.includes(item.value)}
                        onChange={() => toggleBudget(item.value)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <button className="flex w-full items-center justify-between text-sm font-semibold text-[#0e1724]">
                  Location
                  <svg className="h-4 w-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="mt-3 space-y-2 text-sm text-[#5e6d80]">
                  {AVAILABLE_LOCATIONS.map((item) => (
                    <label key={item} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-gray-300"
                          checked={selectedLocations.includes(item)}
                          onChange={() => toggleFilterValue(item, selectedLocations, setSelectedLocations)}
                        />
                        {item}
                      </span>
                      <span className="text-xs text-[#97a4b3]">{locationCounts.get(item) ?? 0}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-[#f1f6ff] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d7cf2]">Pro Tip</p>
                <p className="mt-2 text-xs text-[#5e6d80]">
                  Save your filter settings to get notified whenever a matching project is posted.
                </p>
                <button className="mt-3 text-xs font-semibold text-[#0d7cf2] hover:underline">Create Alert</button>
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#5e6d80]">
                <span className="font-semibold text-[#0e1724]">{filteredProjects.length}</span>
                <span>projects found</span>
                {(searchQuery || selectedCategories.length > 0 || selectedLocations.length > 0 || selectedBudgets.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          setSearchQuery("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d5ff] bg-[#e9f2ff] px-3 py-1 text-[11px] font-semibold text-[#0d7cf2]"
                      >
                        Search: {searchQuery}
                        <span className="text-xs">×</span>
                      </button>
                    )}
                    {selectedCategories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleFilterValue(item, selectedCategories, setSelectedCategories)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d5ff] bg-[#e9f2ff] px-3 py-1 text-[11px] font-semibold text-[#0d7cf2]"
                      >
                        {item}
                        <span className="text-xs">×</span>
                      </button>
                    ))}
                    {selectedLocations.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleFilterValue(item, selectedLocations, setSelectedLocations)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d5ff] bg-[#e9f2ff] px-3 py-1 text-[11px] font-semibold text-[#0d7cf2]"
                      >
                        {item}
                        <span className="text-xs">×</span>
                      </button>
                    ))}
                    {selectedBudgets.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleBudget(item)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d5ff] bg-[#e9f2ff] px-3 py-1 text-[11px] font-semibold text-[#0d7cf2]"
                      >
                        {item === "hourly" ? "Hourly Rate" : "Fixed Price"}
                        <span className="text-xs">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5e6d80]">
                <span>Sort by:</span>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-[#0e1724]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="newest">Newest First</option>
                  <option value="budget-high">Budget: High to Low</option>
                  <option value="budget-low">Budget: Low to High</option>
                </select>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <svg className="mx-auto h-12 w-12 text-[#97a4b3] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-base font-medium text-[#5e6d80]">No projects match your filters</p>
                <p className="mt-1 text-sm text-[#97a4b3]">Try clearing filters or widening your search.</p>
                <button
                  onClick={clearAll}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#0d7cf2] bg-white px-5 py-2.5 text-sm font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2] hover:text-white"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-4">
                  {paginatedProjects.map((project) => (
                    <div key={project._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-[#0e1724] line-clamp-1">
                              {project.title}
                            </h3>
                            <span className="rounded-full bg-[#e9f2ff] px-2.5 py-1 text-[10px] font-semibold text-[#0d7cf2]">
                              {project.budgetType === "hourly" ? "Hourly Rate" : "Fixed Price"}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#97a4b3]">
                            <span className="flex items-center gap-1">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" />
                                <circle cx="12" cy="11" r="2.5" />
                              </svg>
                              {project.location || "Location not set"}
                            </span>
                            <span>·</span>
                            <span>{timeAgo(project.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase text-[#97a4b3]">Budget</p>
                          <p className="text-lg font-bold text-[#0d7cf2]">
                            ₨{project.budgetAmount.toLocaleString()}
                            {project.budgetType === "hourly" && <span className="text-xs font-normal">/hr</span>}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-[#5e6d80] line-clamp-2">{project.description}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {(project.category || project.skills?.[0]) && (
                            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0e1724]">
                              {project.category ?? project.skills[0]}
                            </span>
                          )}
                          {project.skills?.map((skill) => (
                            <span key={skill} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5e6d80]">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/projects/${project._id}`}
                          className="rounded-lg border border-[#0d7cf2] bg-white px-4 py-2 text-xs font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2] hover:text-white"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-[#5e6d80] disabled:opacity-50"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {paginationItems.map((item, index) =>
                      item === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-1 text-xs text-[#97a4b3]">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                            item === currentPage
                              ? "bg-[#0d7cf2] text-white"
                              : "border border-gray-200 bg-white text-[#5e6d80] hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
                          }`}
                          onClick={() => setCurrentPage(item as number)}
                        >
                          {item}
                        </button>
                      )
                    )}
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-[#5e6d80] disabled:opacity-50"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <AppFooter className="mt-8" />
    </div>
  );
}
