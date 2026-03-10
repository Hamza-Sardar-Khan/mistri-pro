import mongoose, { Schema, Document, models, model } from "mongoose";
import type { Skill } from "@/lib/constants";

export interface IUser extends Document {
  clerkUserId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  profileComplete: boolean;
  hashtag: string;
  title: string;
  bio: string;
  hourlyRate: number;
  phone: string;
  city: string;
  country: string;
  skills: Skill[];
  education: string;
  experience: string;
  languages: string[];
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: { type: String, required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    profileComplete: { type: Boolean, default: false },
    hashtag: { type: String, default: "" },
    title: { type: String, default: "" },
    bio: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    phone: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    skills: [{ type: String }],
    education: { type: String, default: "" },
    experience: { type: String, default: "" },
    languages: [{ type: String }],
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
