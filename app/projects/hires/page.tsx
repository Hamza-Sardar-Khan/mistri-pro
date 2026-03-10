import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MyHiresPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#0e1724]">My Hires</h2>
          <p className="text-sm text-[#97a4b3] mt-0.5">Manage your hired professionals</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-[#97a4b3] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-base font-medium text-[#5e6d80]">Coming Soon</p>
          <p className="mt-1 text-sm text-[#97a4b3]">
            The hiring feature is under development. Stay tuned!
          </p>
        </div>
      </main>
    </div>
  );
}
