import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IReaction {
  userId: string;
  userName: string;
  type: string; // "like" | "love" | "haha" | "sad" | "angry"
}

export interface IReply {
  clerkUserId: string;
  name: string;
  text: string;
  likes: string[];
  createdAt: Date;
}

export interface IComment {
  clerkUserId: string;
  name: string;
  text: string;
  likes: string[];
  replies: IReply[];
  createdAt: Date;
}

export interface IPost extends Document {
  authorClerkId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  repostOriginal?: {
    authorName: string;
    authorAvatar: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: Date;
  };
  reactions: IReaction[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    type: { type: String, required: true },
  },
  { _id: false }
);

const ReplySchema = new Schema<IReply>(
  {
    clerkUserId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    likes: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CommentSchema = new Schema<IComment>(
  {
    clerkUserId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    likes: [{ type: String }],
    replies: [ReplySchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PostSchema = new Schema<IPost>(
  {
    authorClerkId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String },
    videoUrl: { type: String },
    repostOriginal: {
      authorName: { type: String },
      authorAvatar: { type: String },
      content: { type: String },
      imageUrl: { type: String },
      videoUrl: { type: String },
      createdAt: { type: Date },
    },
    reactions: [ReactionSchema],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

// Force re-registration so schema changes take effect during dev hot reloads
if (models.Post) {
  mongoose.deleteModel("Post");
}
const Post = model<IPost>("Post", PostSchema);

export default Post;
