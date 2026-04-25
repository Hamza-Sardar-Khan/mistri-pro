import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IConversation extends Document {
  contextType: "proposal" | "direct";
  participantIds: string[];
  directKey?: string;
  projectId?: mongoose.Types.ObjectId;
  proposalId?: mongoose.Types.ObjectId;
  projectTitle?: string;
  proposalBudgetAmount?: number;
  proposalEstimatedArrivalAt?: Date;
  proposalEstimatedDurationValue?: number;
  proposalEstimatedDurationUnit?: "hours" | "days";
  proposalContextActivatedAt?: Date;
  clientClerkId: string;
  clientName: string;
  clientAvatar: string;
  workerClerkId: string;
  workerName: string;
  workerAvatar: string;
  lastMessage: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    contextType: { type: String, enum: ["proposal", "direct"], default: "proposal", required: true },
    participantIds: [{ type: String }],
    directKey: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal" },
    projectTitle: { type: String, default: "" },
    proposalBudgetAmount: { type: Number },
    proposalEstimatedArrivalAt: { type: Date },
    proposalEstimatedDurationValue: { type: Number },
    proposalEstimatedDurationUnit: { type: String, enum: ["hours", "days"] },
    proposalContextActivatedAt: { type: Date },
    clientClerkId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientAvatar: { type: String, default: "" },
    workerClerkId: { type: String, required: true },
    workerName: { type: String, required: true },
    workerAvatar: { type: String, default: "" },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

ConversationSchema.index(
  { projectId: 1, proposalId: 1, clientClerkId: 1, workerClerkId: 1 },
  { unique: true }
);
ConversationSchema.index({ directKey: 1 }, { unique: true, sparse: true });
ConversationSchema.index({ participantIds: 1, updatedAt: -1 });
ConversationSchema.index({ clientClerkId: 1, updatedAt: -1 });
ConversationSchema.index({ workerClerkId: 1, updatedAt: -1 });

if (models.Conversation) {
  mongoose.deleteModel("Conversation");
}
const Conversation = model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
