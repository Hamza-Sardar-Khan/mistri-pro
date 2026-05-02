"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveProjectCompletion,
  requestProjectCompletion,
  submitReview,
} from "@/lib/actions/project";
import { getOrCreateProposalConversation } from "@/lib/actions/chat";

type ContractStatus = "active" | "completion-requested" | "completed";
type PaymentStatus = "deposited" | "released";
type CurrentUserRole = "client" | "worker";

interface HireContract {
  _id: string;
  projectId: string;
  proposalId: string;
  projectTitle: string;
  clientClerkId: string;
  clientName: string;
  clientAvatar: string;
  workerClerkId: string;
  workerName: string;
  workerAvatar: string;
  agreedAmount: number;
  status: ContractStatus;
  paymentStatus: PaymentStatus;
  dummyPayment?: {
    payerName: string;
    method: "card" | "bank" | "cash";
    reference: string;
    last4: string;
  };
  paymentDepositedAt?: string;
  completionRequestedAt?: string;
  completedAt?: string;
  paymentReleasedAt?: string;
  updatedAt: string;
  currentUserRole: CurrentUserRole;
  hasReviewed: boolean;
}

interface Props {
  contracts: HireContract[];
}

function statusLabel(status: ContractStatus) {
  if (status === "completion-requested") return "Awaiting approval";
  if (status === "completed") return "Completed";
  return "Active";
}

function dateLabel(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function personInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "M";
}

export default function HiresClient({ contracts }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewContract, setReviewContract] = useState<HireContract | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const groups = useMemo(() => {
    const byRole = {
      client: contracts.filter((contract) => contract.currentUserRole === "client"),
      worker: contracts.filter((contract) => contract.currentUserRole === "worker"),
    };

    const byStatus = (items: HireContract[]) => ({
      active: items.filter((contract) => contract.status === "active"),
      requested: items.filter((contract) => contract.status === "completion-requested"),
      completed: items.filter((contract) => contract.status === "completed"),
    });

    return {
      client: byStatus(byRole.client),
      worker: byStatus(byRole.worker),
      clientTotal: byRole.client.length,
      workerTotal: byRole.worker.length,
    };
  }, [contracts]);

  const openChat = async (contract: HireContract) => {
    setBusyId(contract._id);
    try {
      const conversation = await getOrCreateProposalConversation(contract.projectId, contract.proposalId);
      router.push(`/inbox?conversation=${conversation._id}`);
    } catch (error) {
      console.error(error);
      alert("Chat could not be opened. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const requestCompletion = async (contract: HireContract) => {
    setBusyId(contract._id);
    try {
      await requestProjectCompletion(contract._id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not request completion.");
    } finally {
      setBusyId(null);
    }
  };

  const approveCompletion = async (contract: HireContract) => {
    setBusyId(contract._id);
    try {
      await approveProjectCompletion(contract._id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not approve completion.");
    } finally {
      setBusyId(null);
    }
  };

  const sendReview = async () => {
    if (!reviewContract) return;
    setBusyId(reviewContract._id);
    try {
      await submitReview({
        contractId: reviewContract._id,
        revieweeClerkId:
          reviewContract.currentUserRole === "client"
            ? reviewContract.workerClerkId
            : reviewContract.clientClerkId,
        rating,
        comment,
      });
      setReviewContract(null);
      setRating(5);
      setComment("");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not submit review.");
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = (contract: HireContract) => {
    const isClient = contract.currentUserRole === "client";
    const otherName = isClient ? contract.workerName : contract.clientName;
    const otherAvatar = isClient ? contract.workerAvatar : contract.clientAvatar;
    const otherId = isClient ? contract.workerClerkId : contract.clientClerkId;

    return (
      <article key={contract._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                contract.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : contract.status === "completion-requested"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-[#e9f2ff] text-[#0d7cf2]"
              }`}>
                {statusLabel(contract.status)}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-[#5e6d80]">
                Payment {contract.paymentStatus}
              </span>
            </div>
            <Link
              href={`/projects/${contract.projectId}`}
              className="mt-3 block text-lg font-bold text-[#0e1724] hover:text-[#0d7cf2]"
            >
              {contract.projectTitle}
            </Link>
            <div className="mt-3 flex items-center gap-3">
              {otherAvatar ? (
                <img src={otherAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                  {personInitial(otherName)}
                </div>
              )}
              <div>
                <Link href={`/profile/${otherId}`} className="text-sm font-semibold text-[#0e1724] hover:text-[#0d7cf2]">
                  {otherName}
                </Link>
                <p className="text-xs text-[#97a4b3]">{isClient ? "Hired worker" : "Client"}</p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xl font-extrabold text-[#0e1724]">₨{contract.agreedAmount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#97a4b3]">
              Deposit {dateLabel(contract.paymentDepositedAt)}
            </p>
            {contract.paymentReleasedAt && (
              <p className="text-xs text-green-700">Released {dateLabel(contract.paymentReleasedAt)}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openChat(contract)}
            disabled={busyId === contract._id}
            className="rounded-lg border border-[#0d7cf2]/30 bg-white px-4 py-2 text-sm font-semibold text-[#0d7cf2] hover:bg-[#0d7cf2]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Chat
          </button>
          <Link
            href={`/projects/${contract.projectId}`}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#5e6d80] hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
          >
            View Project
          </Link>
          {!isClient && contract.status === "active" && (
            <button
              type="button"
              onClick={() => requestCompletion(contract)}
              disabled={busyId === contract._id}
              className="rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Request Completion
            </button>
          )}
          {isClient && contract.status === "completion-requested" && (
            <button
              type="button"
              onClick={() => approveCompletion(contract)}
              disabled={busyId === contract._id}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Approve & Release
            </button>
          )}
          {contract.status === "completed" && !contract.hasReviewed && (
            <button
              type="button"
              onClick={() => setReviewContract(contract)}
              className="rounded-lg bg-[#0e1724] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f2937]"
            >
              Leave Review
            </button>
          )}
          {contract.status === "completed" && contract.hasReviewed && (
            <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-[#5e6d80]">
              Review submitted
            </span>
          )}
        </div>
      </article>
    );
  };

  const renderStatusSection = (title: string, items: HireContract[], emptyText: string) => (
    <section className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#5e6d80]">{title}</h3>
        <span className="text-xs font-semibold text-[#97a4b3]">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-[#97a4b3]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-4">{items.map(renderCard)}</div>
      )}
    </section>
  );

  const renderRoleGroup = (
    title: string,
    description: string,
    total: number,
    items: { active: HireContract[]; requested: HireContract[]; completed: HireContract[] },
    emptyText: string
  ) => (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white/60 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[#0e1724]">{title}</h3>
          <p className="text-sm text-[#97a4b3]">{description}</p>
        </div>
        <span className="text-sm font-semibold text-[#5e6d80]">{total} total</span>
      </div>

      {total === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-[#97a4b3]">
          {emptyText}
        </div>
      ) : (
        <>
          {renderStatusSection("Active", items.active, "No active work here.")}
          {renderStatusSection("Awaiting Client Approval", items.requested, "No work waiting for approval.")}
          {renderStatusSection("Completed", items.completed, "No completed work here yet.")}
        </>
      )}
    </section>
  );

  return (
    <>
      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-medium text-[#5e6d80]">No hires yet</p>
          <p className="mt-1 text-sm text-[#97a4b3]">Accepted proposals will appear here.</p>
        </div>
      ) : (
        <>
          {renderRoleGroup(
            "People I Hired",
            "Contracts where you are the client and someone is working for you.",
            groups.clientTotal,
            groups.client,
            "No one has been hired by you yet."
          )}
          {renderRoleGroup(
            "Jobs I am Hired For",
            "Contracts where you are the hired seller or worker.",
            groups.workerTotal,
            groups.worker,
            "You have not been hired for any jobs yet."
          )}
        </>
      )}

      {reviewContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-[#0e1724]">Leave a review</p>
                <p className="mt-1 text-sm text-[#5e6d80]">{reviewContract.projectTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewContract(null)}
                className="rounded-full p-1 text-[#97a4b3] hover:bg-gray-100 hover:text-[#0e1724]"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[#0e1724]">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={star <= rating ? "text-yellow-400" : "text-gray-300"}
                    aria-label={`${star} star rating`}
                  >
                    <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-semibold text-[#0e1724]">Review</label>
              <textarea
                rows={5}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
                placeholder="Share how the project went..."
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewContract(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#5e6d80] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendReview}
                disabled={busyId === reviewContract._id || !comment.trim()}
                className="rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyId === reviewContract._id ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
