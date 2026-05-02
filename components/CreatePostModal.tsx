"use client";

import { useEffect, useRef, useState } from "react";
import { createPost } from "@/lib/actions/post";

interface CreatePostModalProps {
  userAvatar: string;
  userName: string;
  onClose: () => void;
  initialAction?: "photo" | "link" | null;
  initialFile?: File | null;
  initialPlaceholder?: string | null;
}

export default function CreatePostModal({
  userAvatar,
  userName,
  onClose,
  initialAction,
  initialFile,
  initialPlaceholder,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAction === "photo") {
      if (fileRef.current) {
        fileRef.current.accept = "image/*";
      }
    }
    if (initialAction === "link") {
      setShowLinkInput(true);
      setTimeout(() => linkInputRef.current?.focus(), 0);
    } else {
      setShowLinkInput(false);
      setLinkUrl("");
    }
  }, [initialAction]);

  useEffect(() => {
    if (!initialFile) return;
    setFile(initialFile);
    const type = initialFile.type.startsWith("video") ? "video" : "image";
    setMediaType(type);
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(initialFile);
  }, [initialFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const type = selected.type.startsWith("video") ? "video" : "image";
    setMediaType(type);

    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const removeMedia = () => {
    setFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    const nextContent = linkUrl ? `${content.trim()}\n${linkUrl}`.trim() : content.trim();
    if (!nextContent && !file) return;
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      // Upload file to Cloudinary if present
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        if (data.type === "video") {
          videoUrl = data.url;
        } else {
          imageUrl = data.url;
        }
      }

      await createPost({ content: nextContent, imageUrl, videoUrl });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-[#0e1724]">Create Post</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Author row */}
        <div className="flex items-center gap-3 px-5 pt-4">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-[#0e1724]">{userName}</span>
        </div>

        {/* Text area */}
        <div className="px-5 py-3">
          <textarea
            autoFocus
            rows={4}
            placeholder={initialPlaceholder ?? "What's on your mind?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none rounded-lg border-0 bg-transparent text-[15px] text-[#0e1724] placeholder-[#97a4b3] outline-none"
          />
        </div>

        {showLinkInput && (
          <div className="px-5 pb-3">
            <label className="mb-2 block text-sm font-semibold text-[#2d3a4a]">
              Link URL
            </label>
            <input
              ref={linkInputRef}
              type="url"
              placeholder="https://"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#2d3a4a] focus:border-[#0d7cf2] focus:outline-none"
            />
          </div>
        )}

        {/* Media preview */}
        {mediaPreview && (
          <div className="relative mx-5 mb-3 overflow-hidden rounded-lg border border-gray-200">
            {mediaType === "video" ? (
              <video
                src={mediaPreview}
                controls
                className="max-h-64 w-full object-contain bg-black"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="preview"
                className="max-h-64 w-full object-contain"
              />
            )}
            <button
              onClick={removeMedia}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <div className="flex items-center gap-1">
            {/* Image button */}
            <button
              type="button"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.accept = "image/*";
                  fileRef.current.click();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#5e6d80] transition hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo
            </button>

            {/* Video button */}
            <button
              type="button"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.accept = "video/*";
                  fileRef.current.click();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#5e6d80] transition hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#5e6d80] transition hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !file)}
            className="rounded-lg bg-[#0d7cf2] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
