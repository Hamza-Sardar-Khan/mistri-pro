"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import Link from "next/link";

type NotificationType = "new-project" | "new-bid" | "new-message" | "hire" | "completion" | "review" | "project-alert";

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
  userSkills: string[];
  currentUserId: string;
  initialNotifications?: Notification[];
}

export default function NotificationBell({ userSkills, currentUserId, initialNotifications = [] }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [showDropdown, setShowDropdown] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  const unreadCount = notifications.length - seenCount;

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, 30);
    });
  }, []);

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
    if (data.clientClerkId === currentUserId) return;

    addNotification({
      id: `project-${data._id}`,
      type: "new-project",
      title: data.title,
      body: `by ${data.clientName} · ₨${data.budgetAmount.toLocaleString()}${data.budgetType === "hourly" ? "/hr" : ""}`,
      href: `/projects/${data._id}`,
      projectId: data._id,
      actorName: data.clientName,
      skills: data.skills,
      createdAt: data.createdAt,
    });
  }, [addNotification, currentUserId]);

  const handlePersonalNotification = useCallback((data: Notification) => {
    addNotification(data);
  }, [addNotification]);

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

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `user-${currentUserId}`;
    const channel = pusher.subscribe(channelName);
    channel.bind("new-notification", handlePersonalNotification);

    return () => {
      channel.unbind("new-notification", handlePersonalNotification);
      pusher.unsubscribe(channelName);
    };
  }, [currentUserId, handlePersonalNotification]);

  const labelFor = (type: NotificationType) => {
    if (type === "new-bid") return "Bid";
    if (type === "new-message") return "Message";
    if (type === "hire") return "Hire";
    if (type === "completion") return "Status";
    if (type === "review") return "Review";
    if (type === "project-alert") return "Alert";
    return "Project";
  };

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
          <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#0e1724]">Notifications</h3>
            </div>
            <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto sm:max-h-80">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#97a4b3]">No notifications yet</p>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => setShowDropdown(false)}
                    className="block border-b border-gray-50 px-4 py-3 transition hover:bg-gray-50 last:border-0"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-[#0d7cf2]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d7cf2]">
                        {labelFor(notification.type)}
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
                    {notification.skills && notification.skills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {notification.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-full bg-[#0d7cf2]/10 px-2 py-0.5 text-[10px] font-medium text-[#0d7cf2]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
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
