import { Schema, Document, models, model } from "mongoose";

export interface INotification extends Document {
  id: string;
  recipientClerkId: string;
  type: "new-bid" | "new-message" | "hire" | "completion" | "review" | "project-alert";
  title: string;
  body: string;
  href: string;
  projectId?: string;
  proposalId?: string;
  contractId?: string;
  actorName?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true },
    recipientClerkId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["new-bid", "new-message", "hire", "completion", "review", "project-alert"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String, required: true },
    projectId: { type: String },
    proposalId: { type: String },
    contractId: { type: String },
    actorName: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientClerkId: 1, createdAt: -1 });

const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);

export default Notification;
