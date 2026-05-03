import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  proposalId?: mongoose.Types.ObjectId;
  senderClerkId: string;
  senderName: string;
  senderAvatar: string;
  recipientClerkId: string;
  text: string;
  attachments: {
    url: string;
    type: "image" | "video" | "audio" | "file";
    name: string;
    size: number;
  }[];
  readAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal" },
    senderClerkId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: "" },
    recipientClerkId: { type: String, required: true },
    text: { type: String, default: "", maxlength: 2000 },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video", "audio", "file"], required: true },
        name: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
    readAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ recipientClerkId: 1, createdAt: -1 });

if (models.Message) {
  mongoose.deleteModel("Message");
}
const Message = model<IMessage>("Message", MessageSchema);

export default Message;
