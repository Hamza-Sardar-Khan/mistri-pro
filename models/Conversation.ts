import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IConversation extends Document {
  projectId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
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
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", required: true },
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
ConversationSchema.index({ clientClerkId: 1, updatedAt: -1 });
ConversationSchema.index({ workerClerkId: 1, updatedAt: -1 });

const Conversation =
  models.Conversation || model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
