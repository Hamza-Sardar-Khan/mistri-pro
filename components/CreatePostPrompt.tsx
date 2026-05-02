"use client";

import { useRef, useState } from "react";
import CreatePostModal from "./CreatePostModal";

interface CreatePostPromptProps {
  userAvatar: string;
  userName: string;
  userFallbackAvatar?: string;
}

export default function CreatePostPrompt({
  userAvatar,
  userName,
  userFallbackAvatar,
}: CreatePostPromptProps) {
  const [showModal, setShowModal] = useState(false);
  const [initialAction, setInitialAction] = useState<"photo" | "link" | null>(null);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [initialPlaceholder, setInitialPlaceholder] = useState<string | null>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  const openModal = (
    action: "photo" | "link" | null = null,
    placeholder: string | null = null
  ) => {
    setInitialAction(action);
    setInitialPlaceholder(placeholder);
    if (action !== "photo") {
      setInitialFile(null);
    }
    setShowModal(true);
  };

  const handlePhotoClick = () => {
    if (filePickerRef.current) {
      filePickerRef.current.value = "";
      filePickerRef.current.accept = "image/*";
      filePickerRef.current.click();
    }
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setInitialFile(selected);
    openModal("photo");
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          onClick={() => openModal()}
          className="flex cursor-pointer items-center gap-3 px-5 py-4"
        >
          {userAvatar || userFallbackAvatar ? (
            <img
              src={userAvatar || userFallbackAvatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 rounded-full border border-gray-200 bg-[#f7f9fc] px-4 py-2.5 text-sm text-[#97a4b3]">
            What&apos;s on your mind, {userName.split(" ")[0]}?
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <div className="flex items-center gap-6 text-sm text-[#5e6d80]">
            <button type="button" className="flex items-center gap-2" onClick={handlePhotoClick}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7h3l2-2h6l2 2h3v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10a3 3 0 100 6 3 3 0 000-6z"
                />
              </svg>
              Photo
            </button>
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => openModal(null, "What type of job are you looking for?")}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 6h6l1 2h4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8h4l1-2z"
                />
              </svg>
              Job
            </button>
            <button type="button" className="flex items-center gap-2" onClick={() => openModal("link")}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l4-4m-5 7l-2 2a4 4 0 01-5.656-5.656l2-2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10l2-2a4 4 0 015.656 5.656l-2 2"
                />
              </svg>
              Link
            </button>
          </div>
          <button
            type="button"
            onClick={() => openModal()}
            className="rounded-full bg-[#0d7cf2] px-5 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Post
          </button>
        </div>
      </div>

      {showModal && (
        <CreatePostModal
          userAvatar={userAvatar}
          userName={userName}
          onClose={() => {
            setShowModal(false);
            setInitialAction(null);
            setInitialFile(null);
            setInitialPlaceholder(null);
          }}
          initialAction={initialAction}
          initialFile={initialFile}
          initialPlaceholder={initialPlaceholder}
        />
      )}
      <input
        ref={filePickerRef}
        type="file"
        className="hidden"
        onChange={handlePhotoSelected}
      />
    </>
  );
}
