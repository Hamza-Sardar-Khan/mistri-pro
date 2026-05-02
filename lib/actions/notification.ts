"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

export type StoredNotificationInput = {
  id: string;
  type: "new-bid" | "new-message" | "hire" | "completion" | "review" | "project-alert";
  title: string;
  body: string;
  href: string;
  projectId?: string;
  proposalId?: string;
  contractId?: string;
  actorName?: string;
  createdAt?: string;
};

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function storeNotification(recipientClerkId: string, data: StoredNotificationInput) {
  await connectDB();
  const notification = await Notification.findOneAndUpdate(
    { id: data.id },
    {
      ...data,
      recipientClerkId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return serialize(notification);
}

export async function getMyNotifications() {
  const user = await currentUser();
  if (!user) return [];

  await connectDB();
  const notifications = await Notification.find({ recipientClerkId: user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return serialize(notifications);
}
