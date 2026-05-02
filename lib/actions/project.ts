"use server";

import mongoose from "mongoose";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import Project from "@/models/Project";
import Proposal from "@/models/Proposal";
import Contract from "@/models/Contract";
import Review from "@/models/Review";
import ProjectAlert from "@/models/ProjectAlert";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import { getPusherServer } from "@/lib/pusher-server";
import { storeNotification, type StoredNotificationInput } from "@/lib/actions/notification";
import { revalidatePath } from "next/cache";
import type { Skill } from "@/lib/constants";

type FakePaymentData = {
  payerName: string;
  method: "card" | "bank" | "cash";
  reference: string;
  cardNumber?: string;
};

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function clerkDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return "Anonymous";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous";
}

async function averageRatingFor(clerkUserId: string) {
  const result = await Review.aggregate([
    { $match: { revieweeClerkId: clerkUserId } },
    { $group: { _id: "$revieweeClerkId", average: { $avg: "$rating" } } },
  ]);
  return Number(result[0]?.average ?? 0);
}

async function notifyUser(recipientClerkId: string, data: StoredNotificationInput) {
  const notification = await storeNotification(recipientClerkId, data);
  await getPusherServer().trigger(`user-${recipientClerkId}`, "new-notification", notification);
  return notification;
}

function textMatchesProject(query: string, project: {
  title: string;
  description: string;
  category: string;
  location: string;
  skills: string[];
}) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return [
    project.title,
    project.description,
    project.category,
    project.location,
    ...(project.skills ?? []),
  ].some((value) => value.toLowerCase().includes(normalized));
}

async function notifyMatchingProjectAlerts(project: {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  skills: string[];
  clientClerkId: string;
  clientName: string;
  createdAt: Date;
}) {
  const alerts = await ProjectAlert.find({ clerkUserId: { $ne: project.clientClerkId } }).lean();
  const matchingAlerts = alerts.filter((alert) => {
    const categoryMatch =
      !alert.categories?.length ||
      alert.categories.includes(project.category) ||
      project.skills.some((skill) => alert.categories.includes(skill));
    const locationMatch = !alert.locations?.length || alert.locations.includes(project.location);
    const budgetMatch = !alert.budgetTypes?.length || alert.budgetTypes.includes(project.budgetType);
    return (
      categoryMatch &&
      locationMatch &&
      budgetMatch &&
      textMatchesProject(alert.searchQuery ?? "", project)
    );
  });

  const userIds = Array.from(new Set(matchingAlerts.map((alert) => alert.clerkUserId)));
  await Promise.all(
    userIds.map((recipientClerkId) =>
      notifyUser(recipientClerkId, {
        id: `alert-${project._id.toString()}-${recipientClerkId}`,
        type: "project-alert",
        title: "Project alert match",
        body: `${project.title} matches one of your saved alerts`,
        href: `/projects/${project._id.toString()}`,
        projectId: project._id.toString(),
        actorName: project.clientName,
        createdAt: project.createdAt.toISOString(),
      })
    )
  );
}

/* ── Create a new project ── */
export async function createProject(data: {
  title: string;
  description: string;
  category: Skill;
  location: string;
  complexity: "simple" | "intermediate" | "complex";
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
  const serialized = serialize(project);

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
        category: serialized.category,
        location: serialized.location,
        complexity: serialized.complexity,
        budgetType: serialized.budgetType,
        budgetAmount: serialized.budgetAmount,
        skills: serialized.skills,
        createdAt: serialized.createdAt,
      })
    )
  );

  await notifyMatchingProjectAlerts(project);

  revalidatePath("/dashboard");
  return serialized;
}

/* ── Trending skills by real open project demand ── */
export async function getTrendingProjectSkills(limit = 5) {
  await connectDB();

  const results = await Project.aggregate([
    { $match: { status: "open" } },
    {
      $project: {
        skill: {
          $ifNull: ["$category", { $arrayElemAt: ["$skills", 0] }],
        },
      },
    },
    { $match: { $and: [{ skill: { $ne: null } }, { skill: { $ne: "" } }] } },
    { $group: { _id: "$skill", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);

  return serialize(results.map((item) => ({ skill: item._id as string, count: item.count as number })));
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
  return serialize(projects);
}

/* ── Get a single project by ID ── */
export async function getProjectById(projectId: string) {
  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) return null;
  return serialize(project);
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

  const avgRating = await averageRatingFor(user.id);

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

  const serialized = serialize(proposal);
  const pusher = getPusherServer();
  const bidNotification: StoredNotificationInput = {
    id: `bid-${serialized._id}`,
    type: "new-bid",
    title: "New bid received",
    body: `${serialized.freelancerName} bid ₨${serialized.budgetAmount.toLocaleString()} on ${project.title}`,
    href: `/projects/${data.projectId}#proposal-${serialized._id}`,
    projectId: data.projectId,
    proposalId: serialized._id,
    actorName: serialized.freelancerName,
    createdAt: serialized.createdAt,
  };

  await Promise.all([
    pusher.trigger(`project-${data.projectId}`, "new-bid", { proposal: serialized }),
    notifyUser(project.clientClerkId, bidNotification),
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

  return serialize(proposals);
}

/* ── Get the contract for a project, if one exists ── */
export async function getProjectContract(projectId: string) {
  await connectDB();
  const contract = await Contract.findOne({ projectId }).lean();
  return contract ? serialize(contract) : null;
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
    ...serialize(project),
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

/* ── Accept a proposal and place a dummy escrow deposit ── */
export async function acceptProposalAndDeposit(proposalId: string, paymentData: FakePaymentData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const proposal = await Proposal.findById(proposalId);
  if (!proposal) throw new Error("Proposal not found");

  const project = await Project.findById(proposal.projectId);
  if (!project) throw new Error("Project not found");
  if (project.clientClerkId !== user.id) throw new Error("Forbidden");
  if (project.status !== "open") throw new Error("This project is no longer open for hiring");

  const existingContract = await Contract.findOne({ projectId: project._id });
  if (existingContract) throw new Error("This project already has a hire");

  const payerName = paymentData.payerName.trim();
  const reference = paymentData.reference.trim();
  if (!payerName) throw new Error("Payer name is required");
  if (!reference) throw new Error("Payment reference is required");

  const digits = (paymentData.cardNumber ?? "").replace(/\D/g, "");
  const now = new Date();

  const contract = await Contract.create({
    projectId: project._id,
    proposalId: proposal._id,
    projectTitle: project.title,
    clientClerkId: project.clientClerkId,
    clientName: project.clientName,
    clientAvatar: project.clientAvatar,
    workerClerkId: proposal.freelancerClerkId,
    workerName: proposal.freelancerName,
    workerAvatar: proposal.freelancerAvatar,
    agreedAmount: proposal.budgetAmount,
    status: "active",
    paymentStatus: "deposited",
    dummyPayment: {
      payerName,
      method: paymentData.method,
      reference,
      last4: digits.slice(-4),
    },
    paymentDepositedAt: now,
  });

  proposal.status = "accepted";
  project.status = "in-progress";
  await Promise.all([
    proposal.save(),
    project.save(),
    Proposal.updateMany(
      { projectId: project._id, _id: { $ne: proposal._id }, status: "pending" },
      { $set: { status: "rejected" } }
    ),
  ]);

  const serialized = serialize(contract);
  await notifyUser(proposal.freelancerClerkId, {
    id: `hire-${serialized._id}`,
    type: "hire",
    title: "You were hired",
    body: `${project.clientName} hired you for ${project.title}`,
    href: `/projects/${project._id.toString()}`,
    projectId: project._id.toString(),
    contractId: serialized._id,
    actorName: project.clientName,
    createdAt: serialized.createdAt,
  });

  revalidatePath(`/projects/${project._id.toString()}`);
  revalidatePath("/projects/mine");
  revalidatePath("/projects/hires");
  revalidatePath("/dashboard");
  return serialized;
}

/* ── Hires for the current user, as either client or worker ── */
export async function getMyContracts() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const contracts = await Contract.find({
    $or: [{ clientClerkId: user.id }, { workerClerkId: user.id }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  const contractIds = contracts.map((contract) => contract._id);
  const reviews = await Review.find({
    contractId: { $in: contractIds },
    reviewerClerkId: user.id,
  })
    .select("contractId")
    .lean();

  const reviewedContractIds = new Set(reviews.map((review) => review.contractId.toString()));
  return serialize(
    contracts.map((contract) => ({
      ...contract,
      currentUserRole: contract.clientClerkId === user.id ? "client" : "worker",
      hasReviewed: reviewedContractIds.has(contract._id.toString()),
    }))
  );
}

/* ── Worker asks the client to approve completion ── */
export async function requestProjectCompletion(contractId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const contract = await Contract.findById(contractId);
  if (!contract) throw new Error("Hire not found");
  if (contract.workerClerkId !== user.id) throw new Error("Only the hired worker can request completion");
  if (contract.status !== "active") throw new Error("Completion cannot be requested for this hire");

  contract.status = "completion-requested";
  contract.completionRequestedAt = new Date();
  await contract.save();

  const serialized = serialize(contract);
  await notifyUser(contract.clientClerkId, {
    id: `completion-${serialized._id}`,
    type: "completion",
    title: "Completion requested",
    body: `${contract.workerName} marked ${contract.projectTitle} ready for approval`,
    href: `/projects/${contract.projectId.toString()}`,
    projectId: contract.projectId.toString(),
    contractId: serialized._id,
    actorName: contract.workerName,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/projects/hires");
  revalidatePath(`/projects/${contract.projectId.toString()}`);
  return serialized;
}

/* ── Client approves completion and releases dummy payment ── */
export async function approveProjectCompletion(contractId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const contract = await Contract.findById(contractId);
  if (!contract) throw new Error("Hire not found");
  if (contract.clientClerkId !== user.id) throw new Error("Only the client can approve completion");
  if (contract.status !== "completion-requested") {
    throw new Error("The worker must request completion before approval");
  }

  const now = new Date();
  contract.status = "completed";
  contract.paymentStatus = "released";
  contract.completedAt = now;
  contract.paymentReleasedAt = now;

  await Promise.all([
    contract.save(),
    Project.findByIdAndUpdate(contract.projectId, { status: "closed" }),
  ]);

  const serialized = serialize(contract);
  await notifyUser(contract.workerClerkId, {
    id: `approved-${serialized._id}`,
    type: "completion",
    title: "Project completed",
    body: `${contract.clientName} approved ${contract.projectTitle} and released payment`,
    href: `/projects/${contract.projectId.toString()}`,
    projectId: contract.projectId.toString(),
    contractId: serialized._id,
    actorName: contract.clientName,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/projects/hires");
  revalidatePath(`/projects/${contract.projectId.toString()}`);
  revalidatePath(`/profile/${contract.workerClerkId}`);
  revalidatePath(`/profile/${contract.clientClerkId}`);
  return serialized;
}

/* ── Both sides can review after completion ── */
export async function submitReview(data: {
  contractId: string;
  revieweeClerkId: string;
  rating: number;
  comment: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const rating = Math.round(data.rating);
  const comment = data.comment.trim();
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
  if (!comment) throw new Error("Review comment is required");

  await connectDB();

  const contract = await Contract.findById(data.contractId);
  if (!contract) throw new Error("Hire not found");
  if (contract.status !== "completed") throw new Error("Reviews open after project completion");

  const isClient = contract.clientClerkId === user.id;
  const isWorker = contract.workerClerkId === user.id;
  if (!isClient && !isWorker) throw new Error("Forbidden");

  const expectedReviewee = isClient ? contract.workerClerkId : contract.clientClerkId;
  if (data.revieweeClerkId !== expectedReviewee) throw new Error("Invalid review recipient");

  const existing = await Review.findOne({ contractId: contract._id, reviewerClerkId: user.id });
  if (existing) throw new Error("You have already reviewed this hire");

  const reviewerName = isClient ? contract.clientName : contract.workerName;
  const reviewerAvatar = isClient ? contract.clientAvatar : contract.workerAvatar;
  const revieweeName = isClient ? contract.workerName : contract.clientName;
  const revieweeAvatar = isClient ? contract.workerAvatar : contract.clientAvatar;

  const review = await Review.create({
    contractId: contract._id,
    projectId: contract.projectId,
    projectTitle: contract.projectTitle,
    reviewerClerkId: user.id,
    reviewerName: reviewerName || clerkDisplayName(user),
    reviewerAvatar,
    revieweeClerkId: expectedReviewee,
    revieweeName,
    revieweeAvatar,
    role: isClient ? "client-to-worker" : "worker-to-client",
    rating,
    comment,
  });

  const serialized = serialize(review);
  await notifyUser(expectedReviewee, {
    id: `review-${serialized._id}`,
    type: "review",
    title: "New review received",
    body: `${serialized.reviewerName} reviewed you for ${contract.projectTitle}`,
    href: `/profile/${expectedReviewee}`,
    projectId: contract.projectId.toString(),
    contractId: contract._id.toString(),
    actorName: serialized.reviewerName,
    createdAt: serialized.createdAt,
  });

  revalidatePath("/projects/hires");
  revalidatePath("/profile");
  revalidatePath(`/profile/${expectedReviewee}`);
  revalidatePath(`/profile/${user.id}`);
  return serialized;
}

/* ── Update a project (owner only) ── */
export async function updateProject(
  projectId: string,
  data: {
    title: string;
    description: string;
    category: Skill;
    location: string;
    complexity: "simple" | "intermediate" | "complex";
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
  project.category = data.category;
  project.location = data.location;
  project.complexity = data.complexity;
  project.skills = data.skills;
  project.budgetType = data.budgetType;
  project.budgetAmount = data.budgetAmount;
  project.imageUrls = data.imageUrls;
  project.videoUrls = data.videoUrls;
  project.audioUrls = data.audioUrls;

  await project.save();

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects/mine");
  return serialize(project);
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
    Contract.deleteMany({ projectId: project._id }),
    Review.deleteMany({ projectId: project._id }),
    Conversation.deleteMany({ projectId: project._id }),
    Message.deleteMany({ projectId: project._id }),
  ]);

  revalidatePath("/projects/mine");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
