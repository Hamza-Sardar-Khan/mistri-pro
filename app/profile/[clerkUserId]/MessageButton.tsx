"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateDirectConversation } from "@/lib/actions/chat";

export default function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const openMessage = async () => {
    setLoading(true);
    try {
      const conversation = await getOrCreateDirectConversation(userId);
      router.push(`/inbox?conversation=${conversation._id}`);
    } catch (error) {
      console.error(error);
      alert("Conversation could not be opened. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openMessage}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-[#0d7cf2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
