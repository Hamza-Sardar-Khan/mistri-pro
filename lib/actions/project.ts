"use server";

import mongoose from "mongoose";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import Project from "@/models/Project";
import Proposal from "@/models/Proposal";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import { getPusherServer } from "@/lib/pusher-server";
import { revalidatePath } from "next/cache";
import type { Skill } from "@/lib/constants";

/* ── Create a new project ── */
export async function createProject(data: {
  title: string;
  description: string;
  skills: Skill[];
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  imageUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const project = await Project.create({
    clientClerkId: user.id,
    clientName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    clientAvatar: user.imageUrl ?? "",
    ...data,
  });

  // Notify all users who have matching skills via Pusher
  const pusher = getPusherServer();
  const serialized = JSON.parse(JSON.stringify(project));

  // Fire notifications in parallel for each skill channel
  const channels = data.skills.map((skill) =>
    `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`
  );

  await Promise.all(
    channels.map((channel) =>
      pusher.trigger(channel, "new-project", {
        _id: serialized._id,
        title: serialized.title,
        clientClerkId: user.id,
        clientName: serialized.clientName,
        budgetType: serialized.budgetType,
        budgetAmount: serialized.budgetAmount,
        skills: serialized.skills,
        createdAt: serialized.createdAt,
      })
    )
  );

  revalidatePath("/dashboard");
  return serialized;
}

/* ── Get all open projects (newest first), excluding the current user's own ── */
export async function getProjects() {
  const user = await currentUser();
  await connectDB();

  const filter: Record<string, unknown> = { status: "open" };
  if (user) filter.clientClerkId = { $ne: user.id };

  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(projects));
}

/* ── Get a single project by ID ── */
export async function getProjectById(projectId: string) {
  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) return null;
  return JSON.parse(JSON.stringify(project));
}

/* ── Submit a proposal/bid ── */
export async function submitProposal(data: {
  projectId: string;
  description: string;
  audioUrls: string[];
  budgetAmount: number;
  estimatedArrivalAt: string;
  estimatedDurationValue: number;
  estimatedDurationUnit: "hours" | "days";
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const project = await Project.findById(data.projectId);
  if (!project) throw new Error("Project not found");
  if (project.clientClerkId === user.id) throw new Error("You cannot bid on your own project");
  if (project.status !== "open") throw new Error("This project is not open for bids");

  // Get the user profile for rating and skills
  const dbUser = await User.findOne({ clerkUserId: user.id });
  if (!dbUser) throw new Error("Profile not found");

  const estimatedArrivalAt = new Date(data.estimatedArrivalAt);
  if (Number.isNaN(estimatedArrivalAt.getTime())) {
    throw new Error("Estimated arrival time is invalid");
  }
  if (!data.budgetAmount || data.budgetAmount <= 0) {
    throw new Error("Bid amount must be greater than zero");
  }
  if (!data.estimatedDurationValue || data.estimatedDurationValue <= 0) {
    throw new Error("Estimated duration must be greater than zero");
  }

  // Calculate average rating (mock for now, will use real when reviews exist)
  const avgRating = 0;

  const proposal = await Proposal.create({
    projectId: data.projectId,
    freelancerClerkId: user.id,
    freelancerName: `${dbUser.firstName} ${dbUser.lastName}`.trim() || "Anonymous",
    freelancerAvatar: dbUser.avatarUrl || user.imageUrl || "",
    freelancerRating: avgRating,
    freelancerSkills: dbUser.skills || [],
    description: data.description,
    audioUrls: data.audioUrls,
    budgetAmount: data.budgetAmount,
    estimatedArrivalAt,
    estimatedDurationValue: data.estimatedDurationValue,
    estimatedDurationUnit: data.estimatedDurationUnit,
  });

  const serialized = JSON.parse(JSON.stringify(proposal));
  const pusher = getPusherServer();
  await Promise.all([
    pusher.trigger(`project-${data.projectId}`, "new-bid", { proposal: serialized }),
    pusher.trigger(`user-${project.clientClerkId}`, "new-notification", {
      id: `bid-${serialized._id}`,
      type: "new-bid",
      title: "New bid received",
      body: `${serialized.freelancerName} bid ₨${serialized.budgetAmount.toLocaleString()} on ${project.title}`,
      href: `/projects/${data.projectId}`,
      projectId: data.projectId,
      actorName: serialized.freelancerName,
      createdAt: serialized.createdAt,
    }),
  ]);

  revalidatePath(`/projects/${data.projectId}`);
  return serialized;
}

/* ── Get all proposals for a project, ranked by rating then time ── */
export async function getProjectProposals(projectId: string) {
  await connectDB();

  const proposals = await Proposal.find({ projectId })
    .sort({ freelancerRating: -1, createdAt: 1 })
    .lean();

  return JSON.parse(JSON.stringify(proposals));
}

/* ── Get projects posted by the current user, with proposal counts ── */
export async function getMyProjects() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const projects = await Project.find({ clientClerkId: user.id })
    .sort({ createdAt: -1 })
    .lean();

  // Fetch proposal counts for all projects in one query
  const projectIds = projects.map((p) => p._id);
  const proposalCounts = await Proposal.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: "$projectId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(proposalCounts.map((p: { _id: mongoose.Types.ObjectId; count: number }) => [p._id.toString(), p.count]));

  const result = projects.map((project) => ({
    ...JSON.parse(JSON.stringify(project)),
    proposalCount: countMap.get(project._id.toString()) ?? 0,
  }));

  return result;
}

/* ── Check if current user already submitted a proposal ── */
export async function hasUserProposed(projectId: string) {
  const user = await currentUser();
  if (!user) return false;

  await connectDB();
  const existing = await Proposal.findOne({
    projectId,
    freelancerClerkId: user.id,
  });
  return !!existing;
}

/* ── Update a project (owner only) ── */
export async function updateProject(
  projectId: string,
  data: {
    title: string;
    description: string;
    skills: Skill[];
    budgetType: "fixed" | "hourly";
    budgetAmount: number;
    imageUrls: string[];
    videoUrls: string[];
    audioUrls: string[];
  }
) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  if (project.clientClerkId !== user.id) throw new Error("Forbidden");

  project.title = data.title;
  project.description = data.description;
  project.skills = data.skills;
  project.budgetType = data.budgetType;
  project.budgetAmount = data.budgetAmount;
  project.imageUrls = data.imageUrls;
  project.videoUrls = data.videoUrls;
  project.audioUrls = data.audioUrls;

  await project.save();

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects/mine");
  return JSON.parse(JSON.stringify(project));
}

/* ── Delete a project and its proposals (owner only) ── */
export async function deleteProject(projectId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  if (project.clientClerkId !== user.id) throw new Error("Forbidden");

  await Promise.all([
    Project.findByIdAndDelete(projectId),
    Proposal.deleteMany({ projectId: project._id }),
    Conversation.deleteMany({ projectId: project._id }),
    Message.deleteMany({ projectId: project._id }),
  ]);

  revalidatePath("/projects/mine");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
