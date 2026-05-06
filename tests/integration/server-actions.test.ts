import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  connectDB: vi.fn(),
  revalidatePath: vi.fn(),
  pusherTrigger: vi.fn(),
  notificationFindOneAndUpdate: vi.fn(),
  projectAlertFindOneAndUpdate: vi.fn(),
  projectAlertFind: vi.fn(),
  projectFindById: vi.fn(),
  projectAggregate: vi.fn(),
  projectFindByIdAndUpdate: vi.fn(),
  proposalCreate: vi.fn(),
  proposalFindById: vi.fn(),
  proposalUpdateMany: vi.fn(),
  proposalFind: vi.fn(),
  contractFindById: vi.fn(),
  contractCreate: vi.fn(),
  contractFindOne: vi.fn(),
  reviewAggregate: vi.fn(),
  reviewFindOne: vi.fn(),
  reviewCreate: vi.fn(),
  userFindOne: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("@/lib/db", () => ({
  default: mocks.connectDB,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/pusher-server", () => ({
  getPusherServer: () => ({ trigger: mocks.pusherTrigger }),
}));

vi.mock("@/models/Notification", () => ({
  default: { findOneAndUpdate: mocks.notificationFindOneAndUpdate },
}));

vi.mock("@/models/ProjectAlert", () => ({
  default: {
    findOneAndUpdate: mocks.projectAlertFindOneAndUpdate,
    find: mocks.projectAlertFind,
  },
}));

vi.mock("@/models/Project", () => ({
  default: {
    findById: mocks.projectFindById,
    aggregate: mocks.projectAggregate,
    findByIdAndUpdate: mocks.projectFindByIdAndUpdate,
  },
}));

vi.mock("@/models/Proposal", () => ({
  default: {
    create: mocks.proposalCreate,
    findById: mocks.proposalFindById,
    updateMany: mocks.proposalUpdateMany,
    find: mocks.proposalFind,
  },
}));

vi.mock("@/models/Contract", () => ({
  default: {
    findById: mocks.contractFindById,
    create: mocks.contractCreate,
    findOne: mocks.contractFindOne,
  },
}));

vi.mock("@/models/Review", () => ({
  default: {
    aggregate: mocks.reviewAggregate,
    findOne: mocks.reviewFindOne,
    create: mocks.reviewCreate,
  },
}));

vi.mock("@/models/User", () => ({
  default: { findOne: mocks.userFindOne },
}));

vi.mock("@/models/Conversation", () => ({
  default: {},
}));

vi.mock("@/models/Message", () => ({
  default: {},
}));

describe("server action integration tests with mocked services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue({
      id: "worker_1",
      firstName: "Ali",
      lastName: "Khan",
      imageUrl: "",
    });
  });

  it("stores a notification with recipient and created date", async () => {
    const { storeNotification } = await import("@/lib/actions/notification");
    const stored = {
      id: "bid_1",
      recipientClerkId: "client_1",
      type: "new-bid",
      title: "New bid received",
      body: "Ali bid on Kitchen plumbing repair",
      href: "/projects/project_1#proposal-proposal_1",
    };
    mocks.notificationFindOneAndUpdate.mockResolvedValue(stored);

    const result = await storeNotification("client_1", {
      id: "bid_1",
      type: "new-bid",
      title: "New bid received",
      body: "Ali bid on Kitchen plumbing repair",
      href: "/projects/project_1#proposal-proposal_1",
      createdAt: "2026-05-02T10:00:00.000Z",
    });

    expect(mocks.connectDB).toHaveBeenCalled();
    expect(mocks.notificationFindOneAndUpdate).toHaveBeenCalledWith(
      { id: "bid_1" },
      expect.objectContaining({
        recipientClerkId: "client_1",
        createdAt: expect.any(Date),
      }),
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    expect(result).toMatchObject(stored);
  });

  it("does not create a project alert when no filter is selected", async () => {
    const { createProjectAlert } = await import("@/lib/actions/projectAlert");

    await expect(
      createProjectAlert({
        searchQuery: "   ",
        categories: [],
        locations: [],
        budgetTypes: [],
      })
    ).rejects.toThrow("Choose at least one filter or search term before creating an alert");

    expect(mocks.projectAlertFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it("normalizes and saves a project alert with selected filters", async () => {
    const { createProjectAlert } = await import("@/lib/actions/projectAlert");
    mocks.projectAlertFindOneAndUpdate.mockResolvedValue({
      clerkUserId: "worker_1",
      searchQuery: "Kitchen",
      categories: ["Electrician", "Plumbing"],
      locations: ["Lahore"],
      budgetTypes: ["fixed"],
    });

    await createProjectAlert({
      searchQuery: "  Kitchen  ",
      categories: ["Plumbing", "Electrician", "Plumbing"],
      locations: ["Lahore", ""],
      budgetTypes: ["fixed", "fixed"],
    });

    expect(mocks.projectAlertFindOneAndUpdate).toHaveBeenCalledWith(
      {
        clerkUserId: "worker_1",
        searchQuery: "Kitchen",
        categories: ["Electrician", "Plumbing"],
        locations: ["Lahore"],
        budgetTypes: ["fixed"],
      },
      expect.any(Object),
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  });

  it("rejects a proposal when bid amount is zero", async () => {
    const { submitProposal } = await import("@/lib/actions/project");
    mocks.projectFindById.mockResolvedValue({
      _id: "project_1",
      clientClerkId: "client_1",
      status: "open",
      title: "Kitchen plumbing repair",
    });
    mocks.userFindOne.mockResolvedValue({
      firstName: "Ali",
      lastName: "Khan",
      avatarUrl: "",
      skills: ["Plumbing"],
    });

    await expect(
      submitProposal({
        projectId: "project_1",
        description: "I can repair this in two days.",
        audioUrls: [],
        budgetAmount: 0,
        estimatedArrivalAt: "2026-05-05T10:00:00.000Z",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "days",
      })
    ).rejects.toThrow("Bid amount must be greater than zero");

    expect(mocks.proposalCreate).not.toHaveBeenCalled();
  });

  it("rejects review submission outside the 1 to 5 rating range", async () => {
    const { submitReview } = await import("@/lib/actions/project");

    await expect(
      submitReview({
        contractId: "contract_1",
        revieweeClerkId: "worker_1",
        rating: 6,
        comment: "Excellent service.",
      })
    ).rejects.toThrow("Rating must be between 1 and 5");

    expect(mocks.contractFindById).not.toHaveBeenCalled();
  });

  it("rejects an empty inbox message when there are no attachments", async () => {
    const { sendMessage } = await import("@/lib/actions/chat");

    await expect(
      sendMessage({
        conversationId: "conversation_1",
        text: "   ",
        attachments: [],
      })
    ).rejects.toThrow("Message cannot be empty");
  });

  it("rejects an inbox message longer than 2000 characters", async () => {
    const { sendMessage } = await import("@/lib/actions/chat");

    await expect(
      sendMessage({
        conversationId: "conversation_1",
        text: "a".repeat(2001),
        attachments: [],
      })
    ).rejects.toThrow("Message is too long");
  });
});
