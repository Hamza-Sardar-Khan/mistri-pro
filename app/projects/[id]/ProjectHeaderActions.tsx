"use client";

import { useEffect, useState } from "react";

export default function ProjectHeaderActions({ projectId, title }: { projectId: string; title: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");

  useEffect(() => {
    const stored = localStorage.getItem("mistri.bookmarks");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      setBookmarked(parsed.includes(projectId));
    } catch {
      localStorage.removeItem("mistri.bookmarks");
    }
  }, [projectId]);

  const toggleBookmark = () => {
    const stored = localStorage.getItem("mistri.bookmarks");
    const parsed = stored ? (JSON.parse(stored) as string[]) : [];
    const next = parsed.includes(projectId)
      ? parsed.filter((id) => id !== projectId)
      : [...parsed, projectId];
    localStorage.setItem("mistri.bookmarks", JSON.stringify(next));
    setBookmarked(next.includes(projectId));
  };

  const shareProject = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled share.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Copied");
      setTimeout(() => setShareLabel("Share"), 1200);
    } catch {
      setShareLabel("Copy failed");
      setTimeout(() => setShareLabel("Share"), 1200);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleBookmark}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
          bookmarked
            ? "border-[#0d7cf2] bg-[#e9f2ff] text-[#0d7cf2]"
            : "border-gray-200 text-[#5e6d80] hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
        }`}
        title={bookmarked ? "Remove bookmark" : "Save project"}
        aria-pressed={bookmarked}
      >
        <svg className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12a2 2 0 012 2v14l-8-4-8 4V6a2 2 0 012-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={shareProject}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-[#5e6d80] transition hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
        title={shareLabel}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 19a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19a3 3 0 106 0 3 3 0 00-6 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 8.5l5 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 15.5l5-7" />
        </svg>
      </button>
    </div>
  );
}
