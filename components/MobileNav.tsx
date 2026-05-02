"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

interface Props {
  avatarUrl?: string;
  userName: string;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Browse Projects" },
  { href: "/projects/mine", label: "My Posted Projects" },
  { href: "/projects/hires", label: "Hires & Jobs" },
  { href: "/inbox", label: "Inbox" },
  { href: "/projects/saved", label: "Saved Projects" },
];

export default function MobileNav({ avatarUrl, userName }: Props) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#5e6d80] transition hover:bg-gray-100"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={close} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,360px)] flex-col border-l border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#0e1724]">{userName}</p>
                  <p className="text-xs text-[#97a4b3]">Mistri Pro account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#97a4b3] hover:bg-gray-100 hover:text-[#0e1724]"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-[#0e1724] transition hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-3 border-t border-gray-100" />

              <Link
                href="/projects/post"
                onClick={close}
                className="block rounded-xl border border-[#0d7cf2]/20 bg-[#0d7cf2]/5 px-3 py-3 text-sm font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2]/10"
              >
                Post a Project
              </Link>

              <Link
                href="/profile"
                onClick={close}
                className="mt-3 block rounded-xl px-3 py-3 text-sm font-semibold text-[#0e1724] transition hover:bg-gray-50"
              >
                View Profile
              </Link>
              <Link
                href="/profile/edit"
                onClick={close}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-[#0e1724] transition hover:bg-gray-50"
              >
                Edit Profile
              </Link>
            </nav>

            <div className="border-t border-gray-100 p-3">
              <SignOutButton>
                <button className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#b42318] transition hover:bg-red-50">
                  Log Out
                </button>
              </SignOutButton>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
