import mongoose, { Schema, Document, models, model } from "mongoose";
import type { Skill } from "@/lib/constants";

export interface IProject extends Document {
  clientClerkId: string;
  clientName: string;
  clientAvatar: string;
  title: string;
  description: string;
  skills: Skill[];
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  imageUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
  status: "open" | "in-progress" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    clientClerkId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientAvatar: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: [{ type: String }],
    budgetType: { type: String, enum: ["fixed", "hourly"], required: true },
    budgetAmount: { type: Number, required: true },
    imageUrls: [{ type: String }],
    videoUrls: [{ type: String }],
    audioUrls: [{ type: String }],
    status: { type: String, enum: ["open", "in-progress", "closed"], default: "open" },
  },
  { timestamps: true }
);

ProjectSchema.index({ skills: 1 });
ProjectSchema.index({ status: 1, createdAt: -1 });

const Project = models.Project || model<IProject>("Project", ProjectSchema);

export default Project;
