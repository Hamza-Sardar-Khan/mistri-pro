"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Project from "@/models/Project";
import Proposal from "@/models/Proposal";
import { getPusherServer } from "@/lib/pusher-server";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function requireParticipant(conversationId: string, clerkUserId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const isParticipant =
    conversation.clientClerkId === clerkUserId || conversation.workerClerkId === clerkUserId;
  if (!isParticipant) throw new Error("Forbidden");

  return conversation;
}

export async function getOrCreateConversation(
  projectId: string,
  proposalId: string,
  workerClerkId: string
) {
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
  if (proposal.freelancerClerkId !== workerClerkId) {
    throw new Error("Worker does not match this proposal");
  }

  const isClient = project.clientClerkId === user.id;
  const isWorker = proposal.freelancerClerkId === user.id;
  if (!isClient && !isWorker) throw new Error("Forbidden");

  const conversation = await Conversation.findOneAndUpdate(
    {
      projectId: project._id,
      proposalId: proposal._id,
      clientClerkId: project.clientClerkId,
      workerClerkId: proposal.freelancerClerkId,
    },
    {
      $setOnInsert: {
        projectId: project._id,
        proposalId: proposal._id,
        clientClerkId: project.clientClerkId,
        clientName: project.clientName,
        clientAvatar: project.clientAvatar,
        workerClerkId: proposal.freelancerClerkId,
        workerName: proposal.freelancerName,
        workerAvatar: proposal.freelancerAvatar,
      },
    },
    { new: true, upsert: true }
  );

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

  const isClient = conversation.clientClerkId === user.id;
  const recipientClerkId = isClient ? conversation.workerClerkId : conversation.clientClerkId;
  const senderName = isClient ? conversation.clientName : conversation.workerName;
  const senderAvatar = isClient ? conversation.clientAvatar : conversation.workerAvatar;

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
  await conversation.save();

  const serializedMessage = serialize(message);
  const serializedConversation = serialize(conversation);
  const pusher = getPusherServer();

  await Promise.all([
    pusher.trigger(`conversation-${conversation._id.toString()}`, "new-message", {
      message: serializedMessage,
    }),
    pusher.trigger(`user-${recipientClerkId}`, "new-notification", {
      id: `message-${serializedMessage._id}`,
      type: "new-message",
      title: "New message",
      body: `${senderName}: ${cleanText}`,
      href: `/projects/${conversation.projectId.toString()}?chat=${conversation._id.toString()}`,
      projectId: conversation.projectId.toString(),
      conversationId: conversation._id.toString(),
      actorName: senderName,
      createdAt: serializedMessage.createdAt,
    }),
  ]);

  revalidatePath(`/projects/${conversation.projectId.toString()}`);

  return {
    conversation: serializedConversation,
    message: serializedMessage,
  };
}
