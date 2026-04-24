"use client";

import { useEffect, useRef, useState } from "react";
import { getConversationMessages, sendMessage } from "@/lib/actions/chat";
import { getPusherClient } from "@/lib/pusher-client";

export interface Conversation {
  _id: string;
  projectId: string;
  proposalId: string;
  clientClerkId: string;
  clientName: string;
  clientAvatar: string;
  workerClerkId: string;
  workerName: string;
  workerAvatar: string;
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
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
}

export default function ChatPanel({ conversation, currentUserId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherPerson =
    conversation.clientClerkId === currentUserId
      ? { name: conversation.workerName, avatar: conversation.workerAvatar }
      : { name: conversation.clientName, avatar: conversation.clientAvatar };

  useEffect(() => {
    let active = true;
    setLoading(true);
    getConversationMessages(conversation._id)
      .then((items) => {
        if (active) setMessages(items as Message[]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conversation._id]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `conversation-${conversation._id}`;
    const channel = pusher.subscribe(channelName);

    const handleNewMessage = (payload: { message: Message }) => {
      setMessages((prev) => {
        if (prev.some((message) => message._id === payload.message._id)) return prev;
        return [...prev, payload.message];
      });
    };

    channel.bind("new-message", handleNewMessage);
    return () => {
      channel.unbind("new-message", handleNewMessage);
      pusher.unsubscribe(channelName);
    };
  }, [conversation._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    setSending(true);
    try {
      const result = await sendMessage(conversation._id, text);
      const sent = result.message as Message;
      setMessages((prev) => {
        if (prev.some((message) => message._id === sent._id)) return prev;
        return [...prev, sent];
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
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {otherPerson.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherPerson.avatar}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
              {otherPerson.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#0e1724]">{otherPerson.name}</p>
            <p className="text-xs text-[#97a4b3]">Project negotiation chat</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#97a4b3] transition hover:bg-gray-100 hover:text-[#0e1724]"
        >
          x
        </button>
      </div>

      <div className="h-80 space-y-3 overflow-y-auto bg-gray-50/60 px-5 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#0d7cf2] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-[#5e6d80]">No messages yet</p>
              <p className="mt-1 text-xs text-[#97a4b3]">Start with the details that need clarification.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderClerkId === currentUserId;
            return (
              <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMine
                      ? "bg-[#0d7cf2] text-white"
                      : "border border-gray-200 bg-white text-[#2d3a4a]"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-white/75" : "text-[#97a4b3]"}`}>
                    {new Date(message.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
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
    </div>
  );
}
