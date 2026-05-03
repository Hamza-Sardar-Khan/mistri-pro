"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getConversationById,
  getConversationMessages,
  markMessageDelivered,
  sendMessage,
} from "@/lib/actions/chat";
import { getPusherClient } from "@/lib/pusher-client";

type ContextType = "proposal" | "direct";
type AttachmentType = "image" | "video" | "audio" | "file";

interface Attachment {
  url: string;
  type: AttachmentType;
  name: string;
  size: number;
}

interface PendingAttachment {
  id: string;
  file: File;
  type: AttachmentType;
  name: string;
  size: number;
  previewUrl?: string;
}

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
  recipientClerkId: string;
  text: string;
  attachments?: Attachment[];
  deliveredAt?: string;
  createdAt: string;
}

type DeliveryStatus = "sent" | "delivered";

type LocalMessage = Message & {
  localId?: string;
  deliveryStatus?: DeliveryStatus;
};

interface Props {
  currentUserId: string;
  initialConversations: Conversation[];
}

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

function timeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fileSizeLabel(size: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function typeForFile(file: File): AttachmentType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
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

function currentUserIdentity(conversation: Conversation, currentUserId: string) {
  if (conversation.clientClerkId === currentUserId) {
    return {
      name: conversation.clientName,
      avatar: conversation.clientAvatar,
    };
  }
  return {
    name: conversation.workerName,
    avatar: conversation.workerAvatar,
  };
}

function deliveryStatusFor(message: Message, currentUserId: string): DeliveryStatus | undefined {
  if (message.senderClerkId !== currentUserId) return undefined;
  return message.deliveredAt ? "delivered" : "sent";
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

function AttachmentIcon({ type }: { type: AttachmentType }) {
  const path =
    type === "image"
      ? "M4 16l4-4 3 3 5-6 4 7M4 5h16v14H4z"
      : type === "video"
        ? "M15 10l5-3v10l-5-3M4 6h11v12H4z"
        : type === "audio"
          ? "M12 18a4 4 0 004-4V6a4 4 0 10-8 0v8a4 4 0 004 4zm0 0v4m-4 0h8"
          : "M7 3h7l5 5v13H7zM14 3v5h5";
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

function ProposalContextCard({ conversation }: { conversation: Conversation }) {
  return (
    <Link
      href={`/projects/${conversation.projectId}#proposal-${conversation.proposalId}`}
      className="mx-auto mb-3 block max-w-xl rounded-xl border border-[#0d7cf2]/20 bg-white p-4 shadow-sm transition hover:border-[#0d7cf2]/40 hover:bg-[#0d7cf2]/5"
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

function AttachmentView({
  attachment,
  isMine,
  onPreview,
  onDownload,
}: {
  attachment: Attachment;
  isMine: boolean;
  onPreview: (attachment: Attachment) => void;
  onDownload: (attachment: Attachment) => void;
}) {
  if (attachment.type === "image") {
    return (
      <button
        type="button"
        onClick={() => onPreview(attachment)}
        className="block overflow-hidden rounded-xl text-left"
        aria-label={`Preview ${attachment.name || "image"}`}
      >
        <img src={attachment.url} alt={attachment.name} className="max-h-72 w-full max-w-sm object-cover" />
      </button>
    );
  }

  if (attachment.type === "video") {
    return (
      <div className="space-y-2">
        <video src={attachment.url} controls preload="metadata" className="max-h-72 w-full max-w-sm rounded-xl" />
        <button
          type="button"
          onClick={() => onPreview(attachment)}
          className={`text-xs font-semibold ${isMine ? "text-white/85 hover:text-white" : "text-[#0d7cf2] hover:text-[#0b6ad4]"}`}
        >
          Open preview
        </button>
      </div>
    );
  }

  if (attachment.type === "audio") {
    return <audio src={attachment.url} controls preload="none" className="w-64 max-w-full" />;
  }

  return (
    <button
      type="button"
      onClick={() => onDownload(attachment)}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
        isMine ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
        <AttachmentIcon type="file" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{attachment.name || "File"}</span>
        <span className={`block text-xs ${isMine ? "text-white/70" : "text-[#97a4b3]"}`}>
          {fileSizeLabel(attachment.size)}
        </span>
      </span>
    </button>
  );
}

function AttachmentPreviewModal({
  attachment,
  onClose,
  onDownload,
}: {
  attachment: Attachment | null;
  onClose: () => void;
  onDownload: (attachment: Attachment) => void;
}) {
  if (!attachment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0e1724]">{attachment.name || "Attachment"}</p>
            <p className="text-xs text-[#97a4b3]">{fileSizeLabel(attachment.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(attachment)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#5e6d80] transition hover:border-[#0d7cf2] hover:text-[#0d7cf2]"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5e6d80] transition hover:bg-gray-100"
              aria-label="Close preview"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#111827] p-4">
          {attachment.type === "image" && (
            <img src={attachment.url} alt={attachment.name} className="mx-auto max-h-[78dvh] max-w-full object-contain" />
          )}
          {attachment.type === "video" && (
            <video src={attachment.url} controls autoPlay className="mx-auto max-h-[78dvh] max-w-full rounded-xl" />
          )}
          {attachment.type === "audio" && (
            <div className="flex min-h-60 items-center justify-center">
              <audio src={attachment.url} controls autoPlay className="w-full max-w-xl" />
            </div>
          )}
          {attachment.type === "file" && (
            <div className="flex min-h-60 items-center justify-center">
              <div className="rounded-2xl bg-white px-6 py-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-[#5e6d80]">
                  <AttachmentIcon type="file" />
                </div>
                <p className="max-w-sm truncate text-sm font-semibold text-[#0e1724]">{attachment.name || "File"}</p>
                <p className="mt-1 text-xs text-[#97a4b3]">{fileSizeLabel(attachment.size)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InboxClient({ currentUserId, initialConversations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>(
    sortConversations(initialConversations.filter(shouldShowInList))
  );
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(
    searchParams.get("conversation")
      ? initialConversations.find((item) => item._id === searchParams.get("conversation")) ?? null
      : null
  );
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const activeId = activeConversation?._id ?? null;

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const existing = prev.filter((item) => item._id !== conversation._id);
      if (!shouldShowInList(conversation)) return existing;
      return sortConversations([conversation, ...existing]);
    });
    setActiveConversation((prev) => {
      if (!prev || prev._id !== conversation._id) return prev;
      return conversation;
    });
  }, []);

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
  }, [searchParams, conversations, upsertConversation]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let active = true;
    setLoadingMessages(true);
    getConversationMessages(activeId)
      .then((items) => {
        if (!active) return;
        const typed = items as unknown as Message[];
        setMessages(
          typed.map((message) => ({
            ...message,
            deliveryStatus: deliveryStatusFor(message, currentUserId),
          }))
        );
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
      const handleNewMessage = (payload: {
        message: Message;
        conversation: Conversation;
        clientId?: string | null;
      }) => {
        upsertConversation(payload.conversation);
        if (payload.conversation._id === activeId) {
          setMessages((prev) => {
            const filtered = payload.clientId
              ? prev.filter((message) => message.localId !== payload.clientId && message._id !== payload.clientId)
              : prev;
            if (filtered.some((message) => message._id === payload.message._id)) return filtered;
            return [
              ...filtered,
              {
                ...payload.message,
                deliveryStatus: deliveryStatusFor(payload.message, currentUserId),
              },
            ];
          });
        }
        if (payload.message.recipientClerkId === currentUserId) {
          markMessageDelivered(payload.message._id).catch((error) => console.error(error));
        }
      };
      const handleMessageDelivered = (payload: { messageId: string; deliveredAt?: string }) => {
        if (!payload.messageId) return;
        setMessages((prev) =>
          prev.map((message) => {
            if (message._id !== payload.messageId) return message;
            return {
              ...message,
              deliveredAt: payload.deliveredAt ?? message.deliveredAt,
              deliveryStatus: "delivered",
            };
          })
        );
      };
      channel.bind("new-message", handleNewMessage);
      channel.bind("message-delivered", handleMessageDelivered);
      return { channelName, channel, handleNewMessage, handleMessageDelivered };
    });

    return () => {
      subscriptions.forEach(({ channelName, channel, handleNewMessage, handleMessageDelivered }) => {
        channel.unbind("new-message", handleNewMessage);
        channel.unbind("message-delivered", handleMessageDelivered);
        pusher.unsubscribe(channelName);
      });
    };
  }, [conversations, activeId, upsertConversation, currentUserId]);

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
  }, [currentUserId, upsertConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (!previewAttachment) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewAttachment(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewAttachment]);

  useEffect(() => {
    return () => {
      pendingAttachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, [pendingAttachments]);

  const selectedOtherPerson = useMemo(() => {
    if (!activeConversation) return null;
    return otherPerson(activeConversation, currentUserId);
  }, [activeConversation, currentUserId]);

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const person = otherPerson(conversation, currentUserId);
      return [
        person.name,
        conversation.projectTitle ?? "",
        conversation.lastMessage ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [conversationSearch, conversations, currentUserId]);

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
    setPendingAttachments([]);
    router.push("/inbox");
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const availableSlots = MAX_ATTACHMENTS - pendingAttachments.length;
    if (availableSlots <= 0) {
      alert(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      return;
    }

    const nextAttachments = Array.from(files)
      .slice(0, availableSlots)
      .reduce<PendingAttachment[]>((items, file) => {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          alert(`${file.name} is larger than 25 MB.`);
          return items;
        }
        const type = typeForFile(file);
        items.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          type,
          name: file.name,
          size: file.size,
          previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
        });
        return items;
      }, []);

    setPendingAttachments((prev) => [...prev, ...nextAttachments]);
    setShowAttachMenu(false);
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => {
      const removed = prev.find((attachment) => attachment.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((attachment) => attachment.id !== id);
    });
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const params = new URLSearchParams({
        url: attachment.url,
        name: attachment.name || "attachment",
      });
      const response = await fetch(`/api/attachments/download?${params.toString()}`);
      const errorPayload = response.ok
        ? null
        : await response.clone().json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(errorPayload?.error ?? "Download failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.name || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "This attachment could not be downloaded. Please try again.");
    }
  };

  const uploadAttachment = async (attachment: PendingAttachment, index: number) => {
    setUploadProgress(`Uploading ${index + 1} of ${pendingAttachments.length}...`);
    const formData = new FormData();
    formData.append("file", attachment.file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const uploaded = await response.json().catch(() => null) as {
      url?: string;
      type?: AttachmentType;
      error?: string;
    } | null;

    if (!response.ok || !uploaded?.url) {
      throw new Error(uploaded?.error ?? "Upload failed");
    }

    return {
      url: uploaded.url,
      type: uploaded.type || attachment.type,
      name: attachment.name,
      size: attachment.size,
    };
  };

  const handleSend = async () => {
    if (!activeConversation || sending) return;
    const text = draft.trim();
    if (!text && pendingAttachments.length === 0) return;

    const attachmentsToUpload = pendingAttachments;
    const clientId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const identity = currentUserIdentity(activeConversation, currentUserId);
    if (text) {
      setMessages((prev) => [
        ...prev,
        {
          _id: clientId,
          localId: clientId,
          senderClerkId: currentUserId,
          senderName: identity.name,
          senderAvatar: identity.avatar,
          recipientClerkId: otherPerson(activeConversation, currentUserId).id,
          text,
          attachments: [],
          createdAt: new Date().toISOString(),
          deliveryStatus: "sent",
        },
      ]);
    }
    setDraft("");
    setPendingAttachments([]);
    setSending(true);

    try {
      const attachments: Attachment[] = [];
      for (let index = 0; index < attachmentsToUpload.length; index += 1) {
        attachments.push(await uploadAttachment(attachmentsToUpload[index], index));
      }

      const result = await sendMessage({
        conversationId: activeConversation._id,
        text,
        attachments,
        clientId,
      });
      const sentMessage = result.message as unknown as Message;
      upsertConversation(result.conversation as unknown as Conversation);
      setMessages((prev) => {
        const withoutLocal = prev.filter(
          (message) => message.localId !== result.clientId && message._id !== result.clientId
        );
        if (withoutLocal.some((message) => message._id === sentMessage._id)) {
          return withoutLocal.map((message) =>
            message._id === sentMessage._id
              ? {
                  ...message,
                  deliveredAt: sentMessage.deliveredAt ?? message.deliveredAt,
                  deliveryStatus: "delivered",
                }
              : message
          );
        }
        return [
          ...withoutLocal,
          {
            ...sentMessage,
            deliveryStatus: "delivered",
          },
        ];
      });
      attachmentsToUpload.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    } catch (error) {
      console.error(error);
      setDraft(text);
      setPendingAttachments(attachmentsToUpload);
      setMessages((prev) => prev.filter((message) => message.localId !== clientId));
      alert(error instanceof Error ? error.message : "Message could not be sent. Please try again.");
    } finally {
      setSending(false);
      setUploadProgress("");
    }
  };

  const renderConversationList = () => (
    <aside className={`${activeConversation ? "hidden md:flex" : "flex"} min-h-0 w-full flex-col border-r border-gray-200 bg-white md:w-[360px] lg:w-[390px]`}>
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-[#0e1724]">Inbox</h1>
            <p className="text-xs text-[#97a4b3]">{conversations.length} conversation{conversations.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
          <svg className="h-4 w-4 text-[#97a4b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
            placeholder="Search conversations"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {filteredConversations.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-[#5e6d80]">No conversations found</p>
            <p className="mt-1 text-xs text-[#97a4b3]">Messages from proposals and profiles will appear here.</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const person = otherPerson(conversation, currentUserId);
            const isActive = activeConversation?._id === conversation._id;
            return (
              <button
                key={conversation._id}
                type="button"
                onClick={() => selectConversation(conversation)}
                className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${
                  isActive ? "bg-[#e9f2ff]" : ""
                }`}
              >
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
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
  );

  const renderChat = () => (
    <section className={`${activeConversation ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-[#efeae2]`}>
      {!activeConversation || !selectedOtherPerson ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0d7cf2] shadow-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16v12H4V6zm0 0l8 6 8-6" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#5e6d80]">Select a conversation</p>
            <p className="mt-1 text-sm text-[#97a4b3]">Project and profile messages open here.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeConversation}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#5e6d80] hover:bg-gray-100 md:hidden"
                aria-label="Back to conversations"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {selectedOtherPerson.avatar ? (
                <img
                  src={selectedOtherPerson.avatar}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
                  {selectedOtherPerson.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${selectedOtherPerson.id}`}
                  className="block truncate text-sm font-semibold text-[#0e1724] transition hover:text-[#0d7cf2]"
                >
                  {selectedOtherPerson.name}
                </Link>
              </div>
              {activeConversation.projectId && (
                <Link
                  href={`/projects/${activeConversation.projectId}`}
                  className="hidden rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#5e6d80] transition hover:border-[#0d7cf2] hover:text-[#0d7cf2] sm:inline-flex"
                >
                  View Project
                </Link>
              )}
              <button
                type="button"
                onClick={closeConversation}
                className="hidden h-9 w-9 items-center justify-center rounded-full text-[#5e6d80] transition hover:bg-gray-100 md:flex"
                aria-label="Close conversation"
                title="Close conversation"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#0d7cf2] border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="rounded-2xl bg-white/80 px-5 py-4 shadow-sm">
                  <p className="text-sm font-medium text-[#5e6d80]">No messages yet</p>
                  <p className="mt-1 text-xs text-[#97a4b3]">Send a message to start the conversation.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMine = message.senderClerkId === currentUserId;
                const hasAttachments = Boolean(message.attachments?.length);
                const hasText = Boolean(message.text.trim());
                if (!hasAttachments && !hasText) return null;
                const status = message.deliveryStatus ?? deliveryStatusFor(message, currentUserId);
                const showDoubleTick = isMine && status === "delivered";
                const showSingleTick = isMine && status === "sent";

                return (
                  <div key={message._id}>
                    {shouldShowProposalContext(activeConversation, messages, message, index) && (
                      <ProposalContextCard conversation={activeConversation} />
                    )}
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[68%] ${
                          isMine
                            ? "rounded-br-sm bg-[#0d7cf2] text-white"
                            : "rounded-bl-sm border border-gray-200 bg-white text-[#2d3a4a]"
                        }`}
                      >
                        {hasAttachments && (
                          <div className="mb-2 space-y-2">
                            {message.attachments?.map((attachment) => (
                              <AttachmentView
                                key={`${message._id}-${attachment.url}`}
                                attachment={attachment}
                                isMine={isMine}
                                onPreview={setPreviewAttachment}
                                onDownload={downloadAttachment}
                              />
                            ))}
                          </div>
                        )}
                        {message.text.trim() && <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>}
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine ? "text-white/75" : "text-[#97a4b3]"}`}>
                          <span>{timeLabel(message.createdAt)}</span>
                          {showSingleTick && (
                            <span className="inline-flex items-center text-white/70">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                          )}
                          {showDoubleTick && (
                            <span className="inline-flex items-center text-white">
                              <svg
                                className="h-3.5 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 13l3 3L14 8"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 13l3 3L21 8"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3">
            {pendingAttachments.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="relative flex min-w-44 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
                    {attachment.previewUrl ? (
                      <img src={attachment.previewUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#5e6d80]">
                        <AttachmentIcon type={attachment.type} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#0e1724]">{attachment.name}</p>
                      <p className="text-[11px] text-[#97a4b3]">{fileSizeLabel(attachment.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0e1724] text-xs text-white"
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadProgress && <p className="mb-2 text-xs font-medium text-[#0d7cf2]">{uploadProgress}</p>}

            <div className="flex items-end gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttachMenu((value) => !value)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[#5e6d80] hover:bg-gray-100"
                  aria-label="Attach files"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.19 9.19a2 2 0 11-2.83-2.83l8.49-8.49" />
                  </svg>
                </button>
                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <AttachmentIcon type="image" /> Image
                    </button>
                    <button type="button" onClick={() => videoInputRef.current?.click()} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <AttachmentIcon type="video" /> Video
                    </button>
                    <button type="button" onClick={() => audioInputRef.current?.click()} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <AttachmentIcon type="audio" /> Audio
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <AttachmentIcon type="file" /> File
                    </button>
                  </div>
                )}
              </div>

              <textarea
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={(!draft.trim() && pendingAttachments.length === 0) || sending}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0d7cf2] text-white transition hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );

  return (
    <div className="h-[calc(100dvh-3.5rem)] overflow-hidden bg-white">
      <div className="flex h-full w-full overflow-hidden bg-white">
        {renderConversationList()}
        {renderChat()}
      </div>

      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        onDownload={downloadAttachment}
      />

      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
      <input ref={audioInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
    </div>
  );
}
