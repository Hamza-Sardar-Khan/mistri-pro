import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IReview extends Document {
  contractId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  projectTitle: string;
  reviewerClerkId: string;
  reviewerName: string;
  reviewerAvatar: string;
  revieweeClerkId: string;
  revieweeName: string;
  revieweeAvatar: string;
  role: "client-to-worker" | "worker-to-client";
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    projectTitle: { type: String, required: true },
    reviewerClerkId: { type: String, required: true },
    reviewerName: { type: String, required: true },
    reviewerAvatar: { type: String, default: "" },
    revieweeClerkId: { type: String, required: true },
    revieweeName: { type: String, required: true },
    revieweeAvatar: { type: String, default: "" },
    role: { type: String, enum: ["client-to-worker", "worker-to-client"], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

ReviewSchema.index({ contractId: 1, reviewerClerkId: 1 }, { unique: true });
ReviewSchema.index({ revieweeClerkId: 1, createdAt: -1 });
ReviewSchema.index({ reviewerClerkId: 1, createdAt: -1 });

const Review = models.Review || model<IReview>("Review", ReviewSchema);

export default Review;
