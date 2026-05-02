import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyContracts } from "@/lib/actions/project";
import HiresClient from "./HiresClient";

export const dynamic = "force-dynamic";

export default async function MyHiresPage() {
  const user = await currentUser();
  if (!user) redirect("/");
  const contracts = await getMyContracts();

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#0e1724]">My Hires</h2>
          <p className="text-sm text-[#97a4b3] mt-0.5">Manage active work, approvals, dummy payments, and reviews</p>
        </div>

        <HiresClient contracts={contracts as Parameters<typeof HiresClient>[0]["contracts"]} />
      </main>
    </div>
  );
}
