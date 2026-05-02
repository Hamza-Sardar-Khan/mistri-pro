import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IContract extends Document {
  projectId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  projectTitle: string;
  clientClerkId: string;
  clientName: string;
  clientAvatar: string;
  workerClerkId: string;
  workerName: string;
  workerAvatar: string;
  agreedAmount: number;
  status: "active" | "completion-requested" | "completed";
  paymentStatus: "deposited" | "released";
  dummyPayment: {
    payerName: string;
    method: "card" | "bank" | "cash";
    reference: string;
    last4: string;
  };
  paymentDepositedAt: Date;
  completionRequestedAt?: Date;
  completedAt?: Date;
  paymentReleasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", required: true, unique: true },
    projectTitle: { type: String, required: true },
    clientClerkId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientAvatar: { type: String, default: "" },
    workerClerkId: { type: String, required: true },
    workerName: { type: String, required: true },
    workerAvatar: { type: String, default: "" },
    agreedAmount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["active", "completion-requested", "completed"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["deposited", "released"],
      default: "deposited",
    },
    dummyPayment: {
      payerName: { type: String, required: true },
      method: { type: String, enum: ["card", "bank", "cash"], default: "card" },
      reference: { type: String, required: true },
      last4: { type: String, default: "" },
    },
    paymentDepositedAt: { type: Date, required: true },
    completionRequestedAt: { type: Date },
    completedAt: { type: Date },
    paymentReleasedAt: { type: Date },
  },
  { timestamps: true }
);

ContractSchema.index({ clientClerkId: 1, updatedAt: -1 });
ContractSchema.index({ workerClerkId: 1, updatedAt: -1 });
ContractSchema.index({ status: 1, updatedAt: -1 });

const Contract = models.Contract || model<IContract>("Contract", ContractSchema);

export default Contract;
