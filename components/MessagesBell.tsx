"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPusherClient } from "@/lib/pusher-client";

type NotificationType =
  | "new-project"
  | "new-bid"
  | "new-message"
  | "hire"
  | "completion"
  | "review"
  | "project-alert";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  projectId?: string;
  actorName?: string;
  skills?: string[];
  createdAt: string;
}

interface Props {
  currentUserId: string;
  initialNotifications?: Notification[];
}

export default function MessagesBell({ currentUserId, initialNotifications = [] }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications.filter((item) => item.type === "new-message")
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  const unreadCount = Math.max(0, notifications.length - seenCount);

  const addMessageNotification = useCallback((notification: Notification) => {
    if (notification.type !== "new-message") return;
    setNotifications((prev) => {
      if (prev.some((item) => item.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, 20);
    });
  }, []);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `user-${currentUserId}`;
    const channel = pusher.subscribe(channelName);
    channel.bind("new-notification", addMessageNotification);

    return () => {
      channel.unbind("new-notification", addMessageNotification);
      pusher.unsubscribe(channelName);
    };
  }, [currentUserId, addMessageNotification]);

  const listLabel = useMemo(
    () => (notifications.length === 0 ? "No new messages" : "New messages"),
    [notifications.length]
  );

  const handleHover = (next: boolean) => {
    setShowDropdown(next);
    if (next) setSeenCount(notifications.length);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <Link
        href="/inbox"
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 hover:text-white"
        aria-label="Inbox"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6zm0 0l8 6 8-6" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#0e1724]">{listLabel}</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[#97a4b3]">No new messages yet</p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="block border-b border-gray-50 px-4 py-3 transition hover:bg-gray-50 last:border-0"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#0d7cf2]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d7cf2]">
                      Message
                    </span>
                    <span className="text-[11px] text-[#97a4b3]">
                      {new Date(notification.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0e1724] line-clamp-1">{notification.title}</p>
                  <p className="mt-0.5 text-xs text-[#97a4b3] line-clamp-2">{notification.body}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
