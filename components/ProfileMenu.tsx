"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ProfileMenuProps {
  avatarUrl?: string;
  userName: string;
}

export default function ProfileMenu({ avatarUrl, userName }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  };

  const hide = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button className="flex items-center gap-2" aria-haspopup="menu" aria-expanded={open}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            loading="eager"
            decoding="async"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d7cf2] text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0e1724] transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 11-6 0 3 3 0 016 0zM4 19a8 8 0 0116 0" />
            </svg>
            View Profile
          </Link>
          <Link
            href="/projects/saved"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0e1724] transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12a2 2 0 012 2v14l-8-4-8 4V6a2 2 0 012-2z" />
            </svg>
            Saved Projects
          </Link>
          <Link
            href="/profile/edit"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0e1724] transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );
}
