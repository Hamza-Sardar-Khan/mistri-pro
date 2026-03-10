"use client";

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
  status: string;
  createdAt: string;
}

interface Props {
  proposals: Proposal[];
  isOwner: boolean;
  currentUserId: string;
}

export default function ProposalsList({ proposals, isOwner, currentUserId }: Props) {
  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-base font-medium text-[#97a4b3]">No proposals yet</p>
        <p className="mt-1 text-sm text-[#97a4b3]">Be the first to submit a proposal!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h3 className="text-lg font-bold text-[#0e1724] mb-5">
        Proposals ({proposals.length})
      </h3>

      <div className="space-y-4">
        {proposals.map((proposal, index) => {
          const isMine = proposal.freelancerClerkId === currentUserId;

          return (
            <div
              key={proposal._id}
              className={`rounded-xl border p-5 ${
                isMine
                  ? "border-[#0d7cf2]/30 bg-[#0d7cf2]/5"
                  : "border-gray-200 bg-gray-50/50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
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
                    {/* Rank badge */}
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0e1724] text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0e1724]">
                      {proposal.freelancerName}
                      {isMine && <span className="ml-1.5 text-xs text-[#0d7cf2]">(You)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
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

                <div className="text-right">
                  <p className="text-lg font-bold text-[#0e1724]">₨{proposal.budgetAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Skills */}
              {proposal.freelancerSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {proposal.freelancerSkills.map((skill: string) => (
                    <span key={skill} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-[#5e6d80]">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-[#2d3a4a] leading-relaxed whitespace-pre-wrap">{proposal.description}</p>

              {/* Audio files — only visible to project owner and the proposal author */}
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
    </div>
  );
}
