"use client";

import { SignOutButton } from "@clerk/nextjs";
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

  const toggle = () => setOpen((value) => !value);

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button onClick={toggle} className="flex items-center gap-2" aria-haspopup="menu" aria-expanded={open}>
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
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0e1724] transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 11-6 0 3 3 0 016 0zM4 19a8 8 0 0116 0" />
            </svg>
            View Profile
          </Link>
          <Link
            href="/projects/saved"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0e1724] transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12a2 2 0 012 2v14l-8-4-8 4V6a2 2 0 012-2z" />
            </svg>
            Saved Projects
          </Link>
          <Link
            href="/profile/edit"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0e1724] transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#5e6d80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </Link>
          <div className="my-1 border-t border-gray-100" />
          <SignOutButton>
            <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[#b42318] transition hover:bg-red-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3H9.75m9 0l-3-3m3 3l-3 3" />
              </svg>
              Log Out
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}
