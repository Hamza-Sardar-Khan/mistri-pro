import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
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
      <div className="text-center">
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

          <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
            <button className="w-48 cursor-pointer rounded-md bg-[#0d7cf2] px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-[#0b6ad4]">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </div>

      {/* Footer tagline */}
      <p className="mt-20 text-sm text-[#97a4b3]">
        &copy; {new Date().getFullYear()} Mistri Pro. All rights reserved.
      </p>
    </div>
  );
}
