"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Project from "@/models/Project";
import Proposal from "@/models/Proposal";
import User from "@/models/User";
import { getPusherServer } from "@/lib/pusher-server";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function directKeyFor(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join("::");
}

function participantIdsFor(conversation: {
  participantIds?: string[];
  clientClerkId: string;
  workerClerkId: string;
}) {
  if (conversation.participantIds && conversation.participantIds.length > 0) {
    return conversation.participantIds;
  }
  return [conversation.clientClerkId, conversation.workerClerkId];
}

function otherParticipantId(
  conversation: { participantIds?: string[]; clientClerkId: string; workerClerkId: string },
  currentUserId: string
) {
  return participantIdsFor(conversation).find((id) => id !== currentUserId) ?? "";
}

async function requireParticipant(conversationId: string, clerkUserId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const isParticipant = participantIdsFor(conversation).includes(clerkUserId);
  if (!isParticipant) throw new Error("Forbidden");

  return conversation;
}

export async function getInboxConversations() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const conversations = await Conversation.find({
    $or: [
      { participantIds: user.id },
      { clientClerkId: user.id },
      { workerClerkId: user.id },
    ],
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  const byPair = new Map<string, (typeof conversations)[number]>();
  for (const conversation of conversations) {
    if (
      conversation.contextType === "direct" &&
      !conversation.lastMessage &&
      !conversation.lastMessageAt
    ) {
      continue;
    }

    const pairKey =
      conversation.directKey ||
      directKeyFor(conversation.clientClerkId, conversation.workerClerkId);
    const existing = byPair.get(pairKey);
    if (!existing) {
      byPair.set(pairKey, conversation);
      continue;
    }

    const existingTime = new Date(existing.lastMessageAt ?? existing.updatedAt).getTime();
    const conversationTime = new Date(conversation.lastMessageAt ?? conversation.updatedAt).getTime();
    if (conversationTime > existingTime) byPair.set(pairKey, conversation);
  }

  return serialize(Array.from(byPair.values()));
}

export async function getOrCreateProposalConversation(projectId: string, proposalId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const [project, proposal] = await Promise.all([
    Project.findById(projectId),
    Proposal.findById(proposalId),
  ]);

  if (!project) throw new Error("Project not found");
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.projectId.toString() !== project._id.toString()) {
    throw new Error("Proposal does not belong to this project");
  }
  if (project.clientClerkId !== user.id) {
    throw new Error("Only the project owner can start a proposal chat");
  }

  const directKey = directKeyFor(project.clientClerkId, proposal.freelancerClerkId);
  let conversation = await Conversation.findOne({
    $or: [
      { directKey },
      { clientClerkId: project.clientClerkId, workerClerkId: proposal.freelancerClerkId },
      { clientClerkId: proposal.freelancerClerkId, workerClerkId: project.clientClerkId },
    ],
  }).sort({ lastMessageAt: -1, updatedAt: -1 });

  if (!conversation) {
    conversation = await Conversation.create({
      directKey,
      contextType: "proposal",
      participantIds: [project.clientClerkId, proposal.freelancerClerkId],
      projectId: project._id,
      proposalId: proposal._id,
      projectTitle: project.title,
      proposalBudgetAmount: proposal.budgetAmount,
      proposalEstimatedArrivalAt: proposal.estimatedArrivalAt,
      proposalEstimatedDurationValue: proposal.estimatedDurationValue,
      proposalEstimatedDurationUnit: proposal.estimatedDurationUnit,
      proposalContextActivatedAt: new Date(),
      clientClerkId: project.clientClerkId,
      clientName: project.clientName,
      clientAvatar: project.clientAvatar,
      workerClerkId: proposal.freelancerClerkId,
      workerName: proposal.freelancerName,
      workerAvatar: proposal.freelancerAvatar,
    });
  } else {
    conversation.directKey = directKey;
    conversation.contextType = "proposal";
    conversation.participantIds = [project.clientClerkId, proposal.freelancerClerkId];
    conversation.projectId = project._id;
    conversation.proposalId = proposal._id;
    conversation.projectTitle = project.title;
    conversation.proposalBudgetAmount = proposal.budgetAmount;
    conversation.proposalEstimatedArrivalAt = proposal.estimatedArrivalAt;
    conversation.proposalEstimatedDurationValue = proposal.estimatedDurationValue;
    conversation.proposalEstimatedDurationUnit = proposal.estimatedDurationUnit;
    conversation.proposalContextActivatedAt = new Date();
    conversation.clientClerkId = project.clientClerkId;
    conversation.clientName = project.clientName;
    conversation.clientAvatar = project.clientAvatar;
    conversation.workerClerkId = proposal.freelancerClerkId;
    conversation.workerName = proposal.freelancerName;
    conversation.workerAvatar = proposal.freelancerAvatar;
    await conversation.save();
  }

  revalidatePath("/inbox");
  return serialize(conversation);
}

export async function getOrCreateDirectConversation(otherUserClerkId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  if (otherUserClerkId === user.id) throw new Error("You cannot message yourself");

  await connectDB();

  const [currentDbUser, otherDbUser] = await Promise.all([
    User.findOne({ clerkUserId: user.id }),
    User.findOne({ clerkUserId: otherUserClerkId }),
  ]);

  if (!otherDbUser || !otherDbUser.profileComplete) throw new Error("User profile not found");

  const currentName =
    `${currentDbUser?.firstName ?? user.firstName ?? ""} ${currentDbUser?.lastName ?? user.lastName ?? ""}`.trim() ||
    "Anonymous";
  const otherName = `${otherDbUser.firstName} ${otherDbUser.lastName}`.trim() || "Anonymous";

  const directKey = directKeyFor(user.id, otherUserClerkId);
  const firstIsCurrent = user.id < otherUserClerkId;

  let conversation = await Conversation.findOne({
    $or: [
      { directKey },
      { clientClerkId: user.id, workerClerkId: otherUserClerkId },
      { clientClerkId: otherUserClerkId, workerClerkId: user.id },
    ],
  }).sort({ lastMessageAt: -1, updatedAt: -1 });

  if (!conversation) {
    conversation = await Conversation.create({
        contextType: "direct",
        participantIds: [user.id, otherUserClerkId],
        directKey,
        clientClerkId: firstIsCurrent ? user.id : otherUserClerkId,
        clientName: firstIsCurrent ? currentName : otherName,
        clientAvatar: firstIsCurrent
          ? currentDbUser?.avatarUrl || user.imageUrl || ""
          : otherDbUser.avatarUrl || "",
        workerClerkId: firstIsCurrent ? otherUserClerkId : user.id,
        workerName: firstIsCurrent ? otherName : currentName,
        workerAvatar: firstIsCurrent
          ? otherDbUser.avatarUrl || ""
          : currentDbUser?.avatarUrl || user.imageUrl || "",
    });
  } else {
    conversation.directKey = directKey;
    conversation.participantIds = [conversation.clientClerkId, conversation.workerClerkId];
    await conversation.save();
  }

  revalidatePath("/inbox");
  return serialize(conversation);
}

export async function getConversationById(conversationId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();
  const conversation = await requireParticipant(conversationId, user.id);
  return serialize(conversation);
}

export async function getConversationMessages(conversationId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();
  await requireParticipant(conversationId, user.id);

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
  return serialize(messages);
}

export async function sendMessage(conversationId: string, text: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const cleanText = text.trim();
  if (!cleanText) throw new Error("Message cannot be empty");
  if (cleanText.length > 2000) throw new Error("Message is too long");

  await connectDB();
  const conversation = await requireParticipant(conversationId, user.id);

  const recipientClerkId = otherParticipantId(conversation, user.id);
  if (!recipientClerkId) throw new Error("Recipient not found");

  const isClientSlot = conversation.clientClerkId === user.id;
  const senderName = isClientSlot ? conversation.clientName : conversation.workerName;
  const senderAvatar = isClientSlot ? conversation.clientAvatar : conversation.workerAvatar;

  const message = await Message.create({
    conversationId: conversation._id,
    projectId: conversation.projectId,
    proposalId: conversation.proposalId,
    senderClerkId: user.id,
    senderName,
    senderAvatar,
    recipientClerkId,
    text: cleanText,
  });

  conversation.lastMessage = cleanText;
  conversation.lastMessageAt = message.createdAt;
  if (!conversation.participantIds || conversation.participantIds.length === 0) {
    conversation.participantIds = [conversation.clientClerkId, conversation.workerClerkId];
  }
  await conversation.save();

  const serializedMessage = serialize(message);
  const serializedConversation = serialize(conversation);
  const pusher = getPusherServer();

  await Promise.all([
    pusher.trigger(`conversation-${conversation._id.toString()}`, "new-message", {
      message: serializedMessage,
      conversation: serializedConversation,
    }),
    pusher.trigger(`user-${recipientClerkId}`, "new-notification", {
      id: `message-${serializedMessage._id}`,
      type: "new-message",
      title: "New message",
      body: `${senderName}: ${cleanText}`,
      href: `/inbox?conversation=${conversation._id.toString()}`,
      projectId: conversation.projectId?.toString(),
      conversationId: conversation._id.toString(),
      actorName: senderName,
      createdAt: serializedMessage.createdAt,
    }),
  ]);

  revalidatePath("/inbox");
  if (conversation.projectId) revalidatePath(`/projects/${conversation.projectId.toString()}`);

  return {
    conversation: serializedConversation,
    message: serializedMessage,
  };
}
