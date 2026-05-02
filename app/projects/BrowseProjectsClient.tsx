"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AVAILABLE_LOCATIONS, AVAILABLE_SKILLS } from "@/lib/constants";
import AppFooter from "@/components/AppFooter";
import { createProjectAlert } from "@/lib/actions/projectAlert";

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
type FilterSection = "category" | "budget" | "location";

const BUDGET_OPTIONS: { label: string; value: BudgetType }[] = [
  { label: "Fixed Price", value: "fixed" },
  { label: "Hourly Rate", value: "hourly" },
];

const SORT_OPTIONS: { label: string; description: string; value: SortOption }[] = [
  { label: "Newest First", description: "Recently posted projects", value: "newest" },
  { label: "Budget: High to Low", description: "Highest budgets first", value: "budget-high" },
  { label: "Budget: Low to High", description: "Lowest budgets first", value: "budget-low" },
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
  initialCategory = "",
  initialSearch = "",
}: {
  projects: ProjectListItem[];
  initialCategory?: string;
  initialSearch?: string;
}) {
  const initialCategoryValue = AVAILABLE_SKILLS.includes(initialCategory as (typeof AVAILABLE_SKILLS)[number])
    ? initialCategory
    : "";
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategoryValue ? [initialCategoryValue] : []
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<BudgetType[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [openSections, setOpenSections] = useState<Record<FilterSection, boolean>>({
    category: false,
    budget: false,
    location: false,
  });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const pageSize = 6;
  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!sortMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSortMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [sortMenuOpen]);

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
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safeCurrentPage]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, "ellipsis", totalPages];
    }
    if (safeCurrentPage >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "ellipsis", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "ellipsis", totalPages];
  }, [safeCurrentPage, totalPages]);

  const clearAll = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedBudgets([]);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const toggleFilterValue = (value: string, list: string[], setList: (value: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setCurrentPage(1);
  };

  const toggleBudget = (value: BudgetType) => {
    setSelectedBudgets((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  const toggleSection = (section: FilterSection) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreateAlert = async () => {
    setCreatingAlert(true);
    setAlertMessage("");
    try {
      await createProjectAlert({
        searchQuery,
        categories: selectedCategories,
        locations: selectedLocations,
        budgetTypes: selectedBudgets,
      });
      setAlertMessage("Alert saved. You will get notifications for matching new projects.");
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : "Could not create alert.");
    } finally {
      setCreatingAlert(false);
    }
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
                setCurrentPage(1);
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
                <button
                  type="button"
                  onClick={() => toggleSection("category")}
                  className="flex w-full items-center justify-between text-sm font-semibold text-[#0e1724]"
                >
                  Category
                  <svg className={`h-4 w-4 text-[#97a4b3] transition ${openSections.category ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.category && <div className="mt-3 space-y-2 text-sm text-[#5e6d80]">
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
                </div>}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("budget")}
                  className="flex w-full items-center justify-between text-sm font-semibold text-[#0e1724]"
                >
                  Budget Type
                  <svg className={`h-4 w-4 text-[#97a4b3] transition ${openSections.budget ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.budget && <div className="mt-3 space-y-2 text-sm text-[#5e6d80]">
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
                </div>}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("location")}
                  className="flex w-full items-center justify-between text-sm font-semibold text-[#0e1724]"
                >
                  Location
                  <svg className={`h-4 w-4 text-[#97a4b3] transition ${openSections.location ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.location && <div className="mt-3 space-y-2 text-sm text-[#5e6d80]">
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
                </div>}
              </div>

              <div className="rounded-xl border border-blue-100 bg-[#f1f6ff] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d7cf2]">Pro Tip</p>
                <p className="mt-2 text-xs text-[#5e6d80]">
                  Save your filter settings to get notified whenever a matching project is posted.
                </p>
                <button
                  type="button"
                  onClick={handleCreateAlert}
                  disabled={creatingAlert}
                  className="mt-3 text-xs font-semibold text-[#0d7cf2] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingAlert ? "Saving..." : "Create Alert"}
                </button>
                {alertMessage && <p className="mt-2 text-xs text-[#5e6d80]">{alertMessage}</p>}
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
              <div ref={sortMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((open) => !open)}
                  className="inline-flex min-w-52 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-[#b8d5ff] hover:bg-[#f8fbff]"
                  aria-haspopup="listbox"
                  aria-expanded={sortMenuOpen}
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#97a4b3]">
                      Sort by
                    </span>
                    <span className="block truncate text-sm font-semibold text-[#0e1724]">
                      {selectedSortOption.label}
                    </span>
                  </span>
                  <svg className={`h-4 w-4 shrink-0 text-[#5e6d80] transition ${sortMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {sortMenuOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const selected = sortBy === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setSortBy(option.value);
                            setCurrentPage(1);
                            setSortMenuOpen(false);
                          }}
                          className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                            selected ? "bg-[#e9f2ff]" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${selected ? "text-[#0d7cf2]" : "text-[#0e1724]"}`}>
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#97a4b3]">{option.description}</span>
                          </span>
                          {selected && (
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                    <div key={project._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#0d7cf2]/30 hover:shadow-md">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
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
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-[11px] font-semibold uppercase text-[#97a4b3]">Budget</p>
                          <p className="text-lg font-bold text-[#0d7cf2]">
                            ₨{project.budgetAmount.toLocaleString()}
                            {project.budgetType === "hourly" && <span className="text-xs font-normal">/hr</span>}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-[#5e6d80] line-clamp-3">{project.description}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {(project.category || project.skills?.[0]) && (
                            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0e1724]">
                              {project.category ?? project.skills[0]}
                            </span>
                          )}
                          {Array.from(new Set(project.skills ?? []))
                            .filter((skill) => skill !== project.category)
                            .map((skill) => (
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
                      disabled={safeCurrentPage === 1}
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
                            item === safeCurrentPage
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
                      disabled={safeCurrentPage === totalPages}
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
