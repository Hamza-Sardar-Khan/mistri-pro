import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white">
              <span className="h-3 w-3 rounded-[3px] border-2 border-blue-500" />
            </span>
            MISTRI PRO
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link className="text-slate-600 hover:text-slate-900" href="/sign-in">
              Log In
            </Link>
            <Link
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/sign-up"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7l9 6 9-6m-18 0h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Create Account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Start your journey with Mistri Pro today.
          </p>
        </div>

        <div className="mt-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-md">
          <SignUp forceRedirectUrl="/dashboard" />
        </div>

        <div className="mt-6 text-xs text-slate-400">
          <span>Privacy Policy</span>
          <span className="px-2">·</span>
          <span>Terms of Use</span>
          <span className="px-2">·</span>
          <span>Contact Support</span>
        </div>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-blue-200 bg-white">
              <span className="h-3 w-3 rounded-[3px] border-2 border-blue-500" />
            </span>
            <span>&copy; 2026 MISTRI PRO. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>Help Center</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Contact Us</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
