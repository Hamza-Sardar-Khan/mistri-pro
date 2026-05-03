import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  // Already signed in — go straight to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      {/* Hero */}
      <div className="pt-16 text-center">
        {/* Logo Text — replace with <Image> later */}
        <h1 className="mb-2 text-6xl font-extrabold tracking-tight sm:text-8xl">
          <span className="text-[#0e1724]">
            MISTRI
          </span>{" "}
          <span className="text-[#0d7cf2]">
            PRO
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-lg text-lg text-[#5e6d80]">
          The professional platform connecting skilled tradespeople with clients.
          Showcase your work, grow your network, and land more jobs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <button className="w-48 cursor-pointer rounded-md border border-[#0d7cf2] bg-transparent px-8 py-3 text-lg font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2]/5">
              Log In
            </button>
          </SignInButton>

          <SignUpButton mode="modal" forceRedirectUrl="/profile-setup">
            <button className="w-48 cursor-pointer rounded-md bg-[#0d7cf2] px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-[#0b6ad4]">
              Sign Up
            </button>
          </SignUpButton>
        </div>

        <div className="mx-auto mt-14 w-full max-w-3xl">
          <div className="border-t border-slate-200" />
          <div className="py-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9aa5b1]">
              Trusted by top professionals worldwide
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#9aa5b1]">
              <span>Buildcore</span>
              <span>Skyline</span>
              <span>Terra</span>
              <span>Equinox</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-5xl border-t border-slate-200 bg-slate-50 px-8 py-10 text-left">
          <div className="grid gap-8 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
          <div className="flex flex-col gap-2">
                    <Image
                      src="/logo.png"
                      alt="Mistri Pro"
                      width={70}
                      height={36}
                      objectFit="contain"
                      className="h-8 w-auto scale-300 2xl:scale-500 object-contain"
                    />
            </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                The premier marketplace for connecting talented professionals
                with high-impact projects.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Platform</p>
              <div className="mt-3 space-y-2 text-xs">
                <p>Browse Projects</p>
                <p>Find Professionals</p>
                <p>Success Stories</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Company</p>
              <div className="mt-3 space-y-2 text-xs">
                <p>About Us</p>
                <p>Careers</p>
                <p>Contact</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Resources</p>
              <div className="mt-3 space-y-2 text-xs">
                <p>Help Center</p>
                <p>Community Guidelines</p>
                <p>Trust &amp; Safety</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <p className="mt-12 text-sm text-[#97a4b3]">
        &copy; {new Date().getFullYear()} Mistri Pro. All rights reserved.
      </p>
    </div>
  );
}
