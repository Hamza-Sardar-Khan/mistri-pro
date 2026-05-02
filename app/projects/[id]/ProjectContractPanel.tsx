"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveProjectCompletion, requestProjectCompletion } from "@/lib/actions/project";

interface Contract {
  _id: string;
  projectId: string;
  projectTitle: string;
  clientClerkId: string;
  clientName: string;
  workerClerkId: string;
  workerName: string;
  agreedAmount: number;
  status: "active" | "completion-requested" | "completed";
  paymentStatus: "deposited" | "released";
  completionRequestedAt?: string;
  completedAt?: string;
  paymentReleasedAt?: string;
}

interface Props {
  contract: Contract;
  currentUserId: string;
}

function statusLabel(status: Contract["status"]) {
  if (status === "completion-requested") return "Awaiting client approval";
  if (status === "completed") return "Completed";
  return "Active service";
}

export default function ProjectContractPanel({ contract, currentUserId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isClient = contract.clientClerkId === currentUserId;
  const isWorker = contract.workerClerkId === currentUserId;
  const canRequestCompletion = isWorker && contract.status === "active";
  const canApproveCompletion = isClient && contract.status === "completion-requested";

  const handleRequestCompletion = async () => {
    setBusy(true);
    try {
      await requestProjectCompletion(contract._id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not request completion.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveCompletion = async () => {
    setBusy(true);
    try {
      await approveProjectCompletion(contract._id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not approve completion.");
    } finally {
      setBusy(false);
    }
  };

  if (!isClient && !isWorker) return null;

  return (
    <div className="rounded-2xl border border-[#0d7cf2]/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#0d7cf2]">Hired Service</p>
          <h3 className="mt-1 text-lg font-bold text-[#0e1724]">{statusLabel(contract.status)}</h3>
          <p className="mt-1 text-sm text-[#5e6d80]">
            {isClient ? `You hired ${contract.workerName}.` : `${contract.clientName} hired you.`}
          </p>
          <p className="mt-2 text-xs text-[#97a4b3]">
            Payment is {contract.paymentStatus === "released" ? "released" : "deposited in dummy escrow"}.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xl font-extrabold text-[#0e1724]">₨{contract.agreedAmount.toLocaleString()}</p>
          <p className="text-xs text-[#97a4b3]">Agreed amount</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {canRequestCompletion && (
          <button
            type="button"
            onClick={handleRequestCompletion}
            disabled={busy}
            className="rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Requesting..." : "Request Completion"}
          </button>
        )}
        {canApproveCompletion && (
          <button
            type="button"
            onClick={handleApproveCompletion}
            disabled={busy}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Approving..." : "Approve & Release Payment"}
          </button>
        )}
        {contract.status === "completion-requested" && isWorker && (
          <span className="rounded-lg bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
            Waiting for client approval
          </span>
        )}
        {contract.status === "completed" && (
          <Link
            href="/projects/hires"
            className="rounded-lg bg-[#0e1724] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f2937]"
          >
            Leave Review
          </Link>
        )}
        <Link
          href="/projects/hires"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#5e6d80] hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
        >
          Manage Hire
        </Link>
      </div>
    </div>
  );
}
