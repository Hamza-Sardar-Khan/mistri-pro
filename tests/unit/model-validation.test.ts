import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import Message from "@/models/Message";
import Proposal from "@/models/Proposal";
import Review from "@/models/Review";

describe("Mongoose model validation", () => {
  it("accepts review ratings at the valid 1 and 5 star boundaries", () => {
    const baseReview = {
      contractId: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(),
      projectTitle: "Kitchen plumbing repair",
      reviewerClerkId: "client_1",
      reviewerName: "Client User",
      revieweeClerkId: "worker_1",
      revieweeName: "Worker User",
      role: "client-to-worker",
      comment: "Good work and completed on time.",
    };

    expect(new Review({ ...baseReview, rating: 1 }).validateSync()).toBeUndefined();
    expect(new Review({ ...baseReview, rating: 5 }).validateSync()).toBeUndefined();
  });

  it("rejects review ratings below 1 or above 5", () => {
    const baseReview = {
      contractId: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(),
      projectTitle: "Kitchen plumbing repair",
      reviewerClerkId: "client_1",
      reviewerName: "Client User",
      revieweeClerkId: "worker_1",
      revieweeName: "Worker User",
      role: "client-to-worker",
      comment: "Good work.",
    };

    expect(new Review({ ...baseReview, rating: 0 }).validateSync()?.errors.rating).toBeDefined();
    expect(new Review({ ...baseReview, rating: 6 }).validateSync()?.errors.rating).toBeDefined();
  });

  it("accepts review comments at the 1 and 1000 character boundaries", () => {
    const baseReview = {
      contractId: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(),
      projectTitle: "Kitchen plumbing repair",
      reviewerClerkId: "client_1",
      reviewerName: "Client User",
      revieweeClerkId: "worker_1",
      revieweeName: "Worker User",
      role: "client-to-worker",
      rating: 5,
    };

    expect(new Review({ ...baseReview, comment: "A" }).validateSync()).toBeUndefined();
    expect(new Review({ ...baseReview, comment: "A".repeat(1000) }).validateSync()).toBeUndefined();
  });

  it("rejects review comments below 1 character or above 1000 characters", () => {
    const baseReview = {
      contractId: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(),
      projectTitle: "Kitchen plumbing repair",
      reviewerClerkId: "client_1",
      reviewerName: "Client User",
      revieweeClerkId: "worker_1",
      revieweeName: "Worker User",
      role: "client-to-worker",
      rating: 5,
    };

    expect(new Review({ ...baseReview, comment: "" }).validateSync()?.errors.comment).toBeDefined();
    expect(new Review({ ...baseReview, comment: "A".repeat(1001) }).validateSync()?.errors.comment).toBeDefined();
  });

  it("rejects a proposal duration below the minimum value", () => {
    const proposal = new Proposal({
      projectId: new mongoose.Types.ObjectId(),
      freelancerClerkId: "worker_1",
      freelancerName: "Worker User",
      description: "I can arrive tomorrow and finish this repair.",
      budgetAmount: 5000,
      estimatedArrivalAt: new Date("2026-05-05T10:00:00.000Z"),
      estimatedDurationValue: 0,
      estimatedDurationUnit: "days",
    });

    expect(proposal.validateSync()?.errors.estimatedDurationValue).toBeDefined();
  });

  it("allows an attachment-only chat message to store media metadata", () => {
    const message = new Message({
      conversationId: new mongoose.Types.ObjectId(),
      senderClerkId: "worker_1",
      senderName: "Worker User",
      recipientClerkId: "client_1",
      text: " ",
      attachments: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/sample.webp",
          type: "image",
          name: "sample.webp",
          size: 7010,
        },
      ],
    });

    expect(message.validateSync()).toBeUndefined();
    expect(message.attachments).toHaveLength(1);
  });
});
