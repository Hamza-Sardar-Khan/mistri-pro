import { Schema, Document, models, model } from "mongoose";

export interface IProjectAlert extends Document {
  clerkUserId: string;
  searchQuery: string;
  categories: string[];
  locations: string[];
  budgetTypes: ("fixed" | "hourly")[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectAlertSchema = new Schema<IProjectAlert>(
  {
    clerkUserId: { type: String, required: true },
    searchQuery: { type: String, default: "" },
    categories: [{ type: String }],
    locations: [{ type: String }],
    budgetTypes: [{ type: String, enum: ["fixed", "hourly"] }],
  },
  { timestamps: true }
);

ProjectAlertSchema.index(
  { clerkUserId: 1, searchQuery: 1, categories: 1, locations: 1, budgetTypes: 1 },
  { unique: true }
);
ProjectAlertSchema.index({ clerkUserId: 1, updatedAt: -1 });

const ProjectAlert = models.ProjectAlert || model<IProjectAlert>("ProjectAlert", ProjectAlertSchema);

export default ProjectAlert;
