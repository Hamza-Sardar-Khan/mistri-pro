import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IUser extends Document {
  clerkUserId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: { type: String, required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
