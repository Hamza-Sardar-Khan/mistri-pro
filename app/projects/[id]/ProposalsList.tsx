"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateProposalConversation } from "@/lib/actions/chat";
import { acceptProposalAndDeposit } from "@/lib/actions/project";
import { getPusherClient } from "@/lib/pusher-client";

type SortMode = "best" | "price" | "rating" | "newest";

interface Proposal {
  _id: string;
  freelancerClerkId: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerRating: number;
  freelancerSkills: string[];
  description: string;
  audioUrls: string[];
  budgetAmount: number;
  estimatedArrivalAt?: string;
  estimatedDurationValue?: number;
  estimatedDurationUnit?: "hours" | "days";
  status: string;
  createdAt: string;
}

interface Props {
  projectId: string;
  proposals: Proposal[];
  isOwner: boolean;
  currentUserId: string;
  projectStatus: "open" | "in-progress" | "closed";
  hasContract: boolean;
}

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "best", label: "Best match" },
  { value: "price", label: "Lowest price" },
  { value: "rating", label: "Highest rating" },
  { value: "newest", label: "Newest" },
];

function formatArrival(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function arrivalTimestamp(proposal: Proposal) {
  if (!proposal.estimatedArrivalAt) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(proposal.estimatedArrivalAt).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function durationLabel(proposal: Proposal) {
  if (!proposal.estimatedDurationValue || !proposal.estimatedDurationUnit) return "Not set";
  return `${proposal.estimatedDurationValue} ${proposal.estimatedDurationUnit}`;
}

export default function ProposalsList({
  projectId,
  proposals,
  isOwner,
  currentUserId,
  projectStatus,
  hasContract,
}: Props) {
  const router = useRouter();
  const [liveProposals, setLiveProposals] = useState<Proposal[]>(proposals);
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [openingProposalId, setOpeningProposalId] = useState<string | null>(null);
  const [highlightedProposalId, setHighlightedProposalId] = useState<string | null>(null);
  const [hiringProposal, setHiringProposal] = useState<Proposal | null>(null);
  const [payerName, setPayerName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "cash">("card");
  const [isHiring, setIsHiring] = useState(false);

  useEffect(() => {
    setLiveProposals(proposals);
  }, [proposals]);

  useEffect(() => {
    const scrollToHash = () => {
      const proposalId = window.location.hash.replace("#proposal-", "");
      if (!proposalId) return;

      const element = document.getElementById(`proposal-${proposalId}`);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedProposalId(proposalId);
      window.setTimeout(() => setHighlightedProposalId(null), 2600);
    };

    window.setTimeout(scrollToHash, 100);
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [liveProposals.length]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `project-${projectId}`;
    const channel = pusher.subscribe(channelName);

    const handleNewBid = (payload: { proposal: Proposal }) => {
      setLiveProposals((prev) => {
        if (prev.some((proposal) => proposal._id === payload.proposal._id)) return prev;
        return [payload.proposal, ...prev];
      });
    };

    channel.bind("new-bid", handleNewBid);
    return () => {
      channel.unbind("new-bid", handleNewBid);
      pusher.unsubscribe(channelName);
    };
  }, [projectId]);

  const sortedProposals = useMemo(() => {
    return [...liveProposals].sort((a, b) => {
      if (sortMode === "price") {
        return a.budgetAmount - b.budgetAmount || arrivalTimestamp(a) - arrivalTimestamp(b);
      }
      if (sortMode === "rating") {
        return b.freelancerRating - a.freelancerRating || a.budgetAmount - b.budgetAmount;
      }
      if (sortMode === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (
        b.freelancerRating - a.freelancerRating ||
        a.budgetAmount - b.budgetAmount ||
        arrivalTimestamp(a) - arrivalTimestamp(b)
      );
    });
  }, [liveProposals, sortMode]);

  const openChat = async (proposal: Proposal) => {
    setOpeningProposalId(proposal._id);
    try {
      const conversation = await getOrCreateProposalConversation(projectId, proposal._id);
      router.push(`/inbox?conversation=${conversation._id}`);
    } catch (error) {
      console.error(error);
      alert("Chat could not be opened. Please try again.");
    } finally {
      setOpeningProposalId(null);
    }
  };

  const resetPaymentForm = () => {
    setHiringProposal(null);
    setPayerName("");
    setPaymentReference("");
    setCardNumber("");
    setPaymentMethod("card");
  };

  const handleHire = async () => {
    if (!hiringProposal || isHiring) return;
    setIsHiring(true);
    try {
      await acceptProposalAndDeposit(hiringProposal._id, {
        payerName,
        method: paymentMethod,
        reference: paymentReference,
        cardNumber,
      });
      setLiveProposals((prev) =>
        prev.map((proposal) => ({
          ...proposal,
          status: proposal._id === hiringProposal._id ? "accepted" : proposal.status === "pending" ? "rejected" : proposal.status,
        }))
      );
      resetPaymentForm();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not hire this applicant. Please try again.");
    } finally {
      setIsHiring(false);
    }
  };

  return (
    <div id="applicants" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-[#0e1724]">
            Proposals ({liveProposals.length})
          </h3>
          {liveProposals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSortMode(option.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    sortMode === option.value
                      ? "bg-[#0d7cf2] text-white"
                      : "bg-gray-100 text-[#5e6d80] hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {liveProposals.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-base font-medium text-[#97a4b3]">No proposals yet</p>
            <p className="mt-1 text-sm text-[#97a4b3]">Be the first to submit a proposal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProposals.map((proposal, index) => {
              const isMine = proposal.freelancerClerkId === currentUserId;
              const canChat = isOwner;

              return (
                <div
                  id={`proposal-${proposal._id}`}
                  key={proposal._id}
                  className={`rounded-xl border p-5 transition ${
                    highlightedProposalId === proposal._id
                      ? "border-[#0d7cf2] bg-[#0d7cf2]/10 shadow-md"
                      : ""
                  } ${
                    isMine
                      ? "border-[#0d7cf2]/30 bg-[#0d7cf2]/5"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        {proposal.freelancerAvatar ? (
                          <img
                            src={proposal.freelancerAvatar}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                            {proposal.freelancerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0e1724] text-[10px] font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0e1724]">
                          {proposal.freelancerName}
                          {isMine && <span className="ml-1.5 text-xs text-[#0d7cf2]">(You)</span>}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            proposal.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : proposal.status === "rejected"
                                ? "bg-gray-200 text-[#5e6d80]"
                                : "bg-[#e9f2ff] text-[#0d7cf2]"
                          }`}>
                            {proposal.status}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs text-[#5e6d80]">
                              {proposal.freelancerRating > 0 ? proposal.freelancerRating.toFixed(1) : "New"}
                            </span>
                          </div>
                          <span className="text-xs text-[#97a4b3]">
                            {new Date(proposal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-[#0e1724]">₨{proposal.budgetAmount.toLocaleString()}</p>
                      {canChat && (
                        <div className="mt-2 flex justify-end gap-2">
                          {projectStatus === "open" && !hasContract && proposal.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                setHiringProposal(proposal);
                                setPayerName("");
                                setPaymentReference(`MP-${proposal._id.slice(-6).toUpperCase()}`);
                              }}
                              className="rounded-lg bg-[#0d7cf2] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b6ad4]"
                            >
                              Hire
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openChat(proposal)}
                            disabled={openingProposalId === proposal._id}
                            className="rounded-lg border border-[#0d7cf2]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0d7cf2] transition hover:bg-[#0d7cf2]/5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {openingProposalId === proposal._id ? "Opening..." : "Chat"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                      <p className="text-[11px] font-medium text-[#97a4b3]">ETA / Start</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#0e1724]">
                        {formatArrival(proposal.estimatedArrivalAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                      <p className="text-[11px] font-medium text-[#97a4b3]">Estimated Duration</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#0e1724]">
                        {durationLabel(proposal)}
                      </p>
                    </div>
                  </div>

                  {proposal.freelancerSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {proposal.freelancerSkills.map((skill: string) => (
                        <span key={skill} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-[#5e6d80]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-[#2d3a4a] leading-relaxed whitespace-pre-wrap">{proposal.description}</p>

                  {proposal.audioUrls?.length > 0 && (isOwner || isMine) && (
                    <div className="mt-3 rounded-lg bg-white border border-gray-200 p-3">
                      <p className="text-xs font-medium text-[#97a4b3] mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Private Audio {isOwner && !isMine ? "(Shared with you)" : "(Only visible to you & client)"}
                      </p>
                      {proposal.audioUrls.map((url: string, i: number) => (
                        <audio key={i} src={url} controls preload="none" className="w-full mb-1 last:mb-0" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {hiringProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-[#0e1724]">Hire {hiringProposal.freelancerName}</p>
                  <p className="mt-1 text-sm text-[#5e6d80]">
                    Dummy escrow deposit for ₨{hiringProposal.budgetAmount.toLocaleString()}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="rounded-full p-1 text-[#97a4b3] hover:bg-gray-100 hover:text-[#0e1724]"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#0e1724]">Payer Name</label>
                  <input
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
                    placeholder="Name on dummy payment"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0e1724]">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value as "card" | "bank" | "cash")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
                    >
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0e1724]">Reference</label>
                    <input
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
                    />
                  </div>
                </div>
                {paymentMethod === "card" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0e1724]">Dummy Card Number</label>
                    <input
                      value={cardNumber}
                      onChange={(event) => setCardNumber(event.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#5e6d80] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleHire}
                  disabled={isHiring || !payerName.trim() || !paymentReference.trim()}
                  className="rounded-lg bg-[#0d7cf2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isHiring ? "Depositing..." : "Deposit & Hire"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
