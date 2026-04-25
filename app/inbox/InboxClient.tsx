"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getConversationById,
  getConversationMessages,
  sendMessage,
} from "@/lib/actions/chat";
import { getPusherClient } from "@/lib/pusher-client";

type ContextType = "proposal" | "direct";

interface Conversation {
  _id: string;
  contextType?: ContextType;
  participantIds?: string[];
  projectId?: string;
  proposalId?: string;
  projectTitle?: string;
  proposalBudgetAmount?: number;
  proposalEstimatedArrivalAt?: string;
  proposalEstimatedDurationValue?: number;
  proposalEstimatedDurationUnit?: "hours" | "days";
  proposalContextActivatedAt?: string;
  clientClerkId: string;
  clientName: string;
  clientAvatar: string;
  workerClerkId: string;
  workerName: string;
  workerAvatar: string;
  lastMessage: string;
  lastMessageAt?: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  senderClerkId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
}

interface Props {
  currentUserId: string;
  initialConversations: Conversation[];
}

function timeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatArrival(value?: string) {
  if (!value) return "ETA not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ETA not set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function durationLabel(conversation: Conversation) {
  if (!conversation.proposalEstimatedDurationValue || !conversation.proposalEstimatedDurationUnit) {
    return "Duration not set";
  }
  return `${conversation.proposalEstimatedDurationValue} ${conversation.proposalEstimatedDurationUnit}`;
}

function otherPerson(conversation: Conversation, currentUserId: string) {
  if (conversation.clientClerkId === currentUserId) {
    return {
      id: conversation.workerClerkId,
      name: conversation.workerName,
      avatar: conversation.workerAvatar,
    };
  }
  return {
    id: conversation.clientClerkId,
    name: conversation.clientName,
    avatar: conversation.clientAvatar,
  };
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
    const bTime = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
    return bTime - aTime;
  });
}

function shouldShowInList(conversation: Conversation) {
  return (
    conversation.contextType !== "direct" ||
    Boolean(conversation.lastMessage) ||
    Boolean(conversation.lastMessageAt)
  );
}

function shouldShowProposalContext(
  conversation: Conversation,
  messages: Message[],
  message: Message,
  index: number
) {
  if (conversation.contextType !== "proposal" || !conversation.projectId || !conversation.proposalId) {
    return false;
  }

  if (!conversation.proposalContextActivatedAt) return index === 0;

  const activatedAt = new Date(conversation.proposalContextActivatedAt).getTime();
  const messageTime = new Date(message.createdAt).getTime();
  if (Number.isNaN(activatedAt) || Number.isNaN(messageTime) || messageTime < activatedAt) {
    return false;
  }

  return !messages
    .slice(0, index)
    .some((item) => new Date(item.createdAt).getTime() >= activatedAt);
}

function ProposalContextCard({ conversation }: { conversation: Conversation }) {
  return (
    <Link
      href={`/projects/${conversation.projectId}#proposal-${conversation.proposalId}`}
      className="mb-2 block rounded-xl border border-[#0d7cf2]/20 bg-white p-4 shadow-sm transition hover:border-[#0d7cf2]/40 hover:bg-[#0d7cf2]/5"
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#0d7cf2]">Proposal context</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0e1724]">
            {conversation.projectTitle || "Project proposal"}
          </p>
          <p className="mt-0.5 text-xs text-[#5e6d80]">
            Bid by {conversation.workerName}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-[#0e1724]">
            {conversation.proposalBudgetAmount
              ? `₨${conversation.proposalBudgetAmount.toLocaleString()}`
              : "Bid amount not set"}
          </p>
          <p className="text-xs text-[#97a4b3]">
            {formatArrival(conversation.proposalEstimatedArrivalAt)} · {durationLabel(conversation)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function InboxClient({ currentUserId, initialConversations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>(
    sortConversations(initialConversations.filter(shouldShowInList))
  );
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(
    searchParams.get("conversation")
      ? initialConversations.find((item) => item._id === searchParams.get("conversation")) ?? null
      : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeId = activeConversation?._id ?? null;

  const upsertConversation = (conversation: Conversation) => {
    setConversations((prev) => {
      const existing = prev.filter((item) => item._id !== conversation._id);
      if (!shouldShowInList(conversation)) return existing;
      return sortConversations([conversation, ...existing]);
    });
    setActiveConversation((prev) => {
      if (!prev || prev._id !== conversation._id) return prev;
      return conversation;
    });
  };

  useEffect(() => {
    const queryConversationId = searchParams.get("conversation");
    if (!queryConversationId) {
      setActiveConversation(null);
      return;
    }

    const existing = conversations.find((item) => item._id === queryConversationId);
    if (existing) {
      setActiveConversation(existing);
      return;
    }

    getConversationById(queryConversationId)
      .then((conversation) => {
        const typedConversation = conversation as unknown as Conversation;
        upsertConversation(typedConversation);
        setActiveConversation(typedConversation);
      })
      .catch((error) => console.error(error));
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let active = true;
    setLoadingMessages(true);
    getConversationMessages(activeId)
      .then((items) => {
        if (active) setMessages(items as Message[]);
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });

    return () => {
      active = false;
    };
  }, [activeId]);

  useEffect(() => {
    const pusher = getPusherClient();
    const subscriptions = conversations.map((conversation) => {
      const channelName = `conversation-${conversation._id}`;
      const channel = pusher.subscribe(channelName);
      const handleNewMessage = (payload: { message: Message; conversation: Conversation }) => {
        upsertConversation(payload.conversation);
        if (payload.conversation._id === activeId) {
          setMessages((prev) => {
            if (prev.some((message) => message._id === payload.message._id)) return prev;
            return [...prev, payload.message];
          });
        }
      };
      channel.bind("new-message", handleNewMessage);
      return { channelName, channel, handleNewMessage };
    });

    return () => {
      subscriptions.forEach(({ channelName, channel, handleNewMessage }) => {
        channel.unbind("new-message", handleNewMessage);
        pusher.unsubscribe(channelName);
      });
    };
  }, [conversations, activeId]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `user-${currentUserId}`;
    const channel = pusher.subscribe(channelName);
    const handleNotification = (payload: { type?: string; conversationId?: string }) => {
      if (payload.type !== "new-message" || !payload.conversationId) return;
      getConversationById(payload.conversationId)
        .then((conversation) => upsertConversation(conversation as unknown as Conversation))
        .catch((error) => console.error(error));
    };

    channel.bind("new-notification", handleNotification);
    return () => {
      channel.unbind("new-notification", handleNotification);
      pusher.unsubscribe(channelName);
    };
  }, [currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const selectedOtherPerson = useMemo(() => {
    if (!activeConversation) return null;
    return otherPerson(activeConversation, currentUserId);
  }, [activeConversation, currentUserId]);

  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    router.push(`/inbox?conversation=${conversation._id}`);
  };

  const closeConversation = () => {
    if (activeConversation && !shouldShowInList(activeConversation)) {
      setConversations((prev) => prev.filter((item) => item._id !== activeConversation._id));
    }
    setActiveConversation(null);
    setDraft("");
    router.push("/inbox");
  };

  const handleSend = async () => {
    if (!activeConversation) return;
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    setSending(true);
    try {
      const result = await sendMessage(activeConversation._id, text);
      const sentMessage = result.message as Message;
      upsertConversation(result.conversation as unknown as Conversation);
      setMessages((prev) => {
        if (prev.some((message) => message._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });
    } catch (error) {
      console.error(error);
      setDraft(text);
      alert("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold text-[#0e1724]">Inbox</h2>
          <p className="mt-0.5 text-sm text-[#97a4b3]">Manage project and direct conversations</p>
        </div>

        <div className="grid min-h-[calc(100vh-150px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-[#0e1724]">
                Conversations ({conversations.length})
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-[#5e6d80]">No conversations yet</p>
                  <p className="mt-1 text-xs text-[#97a4b3]">Messages from proposals and profiles will appear here.</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const person = otherPerson(conversation, currentUserId);
                  const isActive = activeConversation?._id === conversation._id;
                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => selectConversation(conversation)}
                      className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        isActive ? "bg-[#0d7cf2]/5" : ""
                      }`}
                    >
                      {person.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.avatar}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#0e1724]">{person.name}</p>
                          <span className="shrink-0 text-[11px] text-[#97a4b3]">
                            {timeLabel(conversation.lastMessageAt ?? conversation.updatedAt)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#5e6d80]">
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[70vh] flex-col">
            {!activeConversation || !selectedOtherPerson ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div>
                  <p className="text-base font-semibold text-[#5e6d80]">Select a conversation</p>
                  <p className="mt-1 text-sm text-[#97a4b3]">Your project and direct messages open here.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    {selectedOtherPerson.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedOtherPerson.avatar}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                        {selectedOtherPerson.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${selectedOtherPerson.id}`}
                        className="truncate text-sm font-semibold text-[#0e1724] transition hover:text-[#0d7cf2]"
                      >
                        {selectedOtherPerson.name}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={closeConversation}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#97a4b3] transition hover:bg-gray-100 hover:text-[#0e1724]"
                      aria-label="Close conversation"
                      title="Close conversation"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-5 py-4">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#0d7cf2] border-t-transparent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <p className="text-sm font-medium text-[#5e6d80]">No messages yet</p>
                        <p className="mt-1 text-xs text-[#97a4b3]">Send a message to start the conversation.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isMine = message.senderClerkId === currentUserId;
                      return (
                        <div key={message._id}>
                          {shouldShowProposalContext(activeConversation, messages, message, index) && (
                            <ProposalContextCard conversation={activeConversation} />
                          )}
                          <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                isMine
                                  ? "bg-[#0d7cf2] text-white"
                                  : "border border-gray-200 bg-white text-[#2d3a4a]"
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                              <p className={`mt-1 text-[10px] ${isMine ? "text-white/75" : "text-[#97a4b3]"}`}>
                                {timeLabel(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="flex gap-2 border-t border-gray-100 p-4">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="min-h-11 flex-1 resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="self-end rounded-lg bg-[#0d7cf2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
