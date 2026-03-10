"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/lib/actions/project";

interface Props {
  projectId: string;
  projectTitle: string;
}

export default function ProjectActions({ projectId, projectTitle }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      router.refresh();
    } catch {
      alert("Failed to delete project.");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/projects/${projectId}/edit`); }}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#5e6d80] transition hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#5e6d80] transition hover:border-red-400 hover:text-red-500"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>

      {showConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => !deleting && setShowConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0e1724] mb-1">Delete Project</h3>
              <p className="text-sm text-[#5e6d80] mb-1">
                Are you sure you want to delete <strong className="text-[#0e1724]">&ldquo;{projectTitle}&rdquo;</strong>?
              </p>
              <p className="text-xs text-[#97a4b3] mb-5">
                This will permanently remove the project and all its proposals. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-[#5e6d80] transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
