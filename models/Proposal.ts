import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IProposal extends Document {
  projectId: mongoose.Types.ObjectId;
  freelancerClerkId: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerRating: number;
  freelancerSkills: string[];
  description: string;
  audioUrls: string[];
  budgetAmount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    freelancerClerkId: { type: String, required: true },
    freelancerName: { type: String, required: true },
    freelancerAvatar: { type: String, default: "" },
    freelancerRating: { type: Number, default: 0 },
    freelancerSkills: [{ type: String }],
    description: { type: String, required: true },
    audioUrls: [{ type: String }],
    budgetAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

ProposalSchema.index({ projectId: 1, freelancerClerkId: 1 }, { unique: true });
ProposalSchema.index({ projectId: 1, freelancerRating: -1, createdAt: 1 });

const Proposal = models.Proposal || model<IProposal>("Proposal", ProposalSchema);

export default Proposal;
