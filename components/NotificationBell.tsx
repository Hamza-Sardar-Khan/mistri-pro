"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import Link from "next/link";

interface Notification {
  id: string;
  projectId: string;
  title: string;
  clientName: string;
  budgetType: string;
  budgetAmount: number;
  skills: string[];
  createdAt: string;
}

interface Props {
  userSkills: string[];
  currentUserId: string;
}

export default function NotificationBell({ userSkills, currentUserId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  const unreadCount = notifications.length - seenCount;

  const handleNewProject = useCallback((data: {
    _id: string;
    title: string;
    clientClerkId?: string;
    clientName: string;
    budgetType: string;
    budgetAmount: number;
    skills: string[];
    createdAt: string;
  }) => {
    // Don't notify the person who posted the project
    if (data.clientClerkId === currentUserId) return;

    const notif: Notification = {
      id: `${data._id}-${Date.now()}`,
      projectId: data._id,
      title: data.title,
      clientName: data.clientName,
      budgetType: data.budgetType,
      budgetAmount: data.budgetAmount,
      skills: data.skills,
      createdAt: data.createdAt,
    };
    setNotifications((prev) => {
      // Deduplicate by projectId
      if (prev.some((n) => n.projectId === data._id)) return prev;
      return [notif, ...prev].slice(0, 20);
    });
  }, [currentUserId]);

  useEffect(() => {
    if (userSkills.length === 0) return;

    const pusher = getPusherClient();
    const channels = userSkills.map((skill) => {
      const channelName = `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`;
      const channel = pusher.subscribe(channelName);
      channel.bind("new-project", handleNewProject);
      return { channelName, channel };
    });

    return () => {
      channels.forEach(({ channelName, channel }) => {
        channel.unbind("new-project", handleNewProject);
        pusher.unsubscribe(channelName);
      });
    };
  }, [userSkills, handleNewProject]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) setSeenCount(notifications.length);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#5e6d80] transition hover:bg-gray-100"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#0e1724]">Project Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#97a4b3]">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={`/projects/${n.projectId}`}
                    onClick={() => setShowDropdown(false)}
                    className="block border-b border-gray-50 px-4 py-3 transition hover:bg-gray-50 last:border-0"
                  >
                    <p className="text-sm font-medium text-[#0e1724] line-clamp-1">{n.title}</p>
                    <p className="mt-0.5 text-xs text-[#97a4b3]">
                      by {n.clientName} · ₨{n.budgetAmount.toLocaleString()}
                      {n.budgetType === "hourly" && "/hr"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {n.skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-full bg-[#0d7cf2]/10 px-2 py-0.5 text-[10px] font-medium text-[#0d7cf2]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
