"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import { revalidatePath } from "next/cache";

/* ── Fetch all posts (newest first) ── */
export async function getPosts() {
  await connectDB();
  const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(posts));
}

/* ── Create a new post ── */
export async function createPost(formData: {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  await Post.create({
    authorClerkId: user.id,
    authorName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    authorAvatar: user.imageUrl ?? "",
    content: formData.content || "",
    imageUrl: formData.imageUrl || undefined,
    videoUrl: formData.videoUrl || undefined,
    reactions: [],
    comments: [],
  });

  revalidatePath("/dashboard");
}

/* ── Delete a post (only the author can delete) ── */
export async function deletePost(postId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (post.authorClerkId !== user.id) {
    throw new Error("Forbidden: you can only delete your own posts");
  }

  await Post.findByIdAndDelete(postId);
  revalidatePath("/dashboard");
}

/* ── Toggle reaction on post ── */
export async function toggleReaction(postId: string, reactionType: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (!post.reactions) post.reactions = [] as any;

  const existingIdx = post.reactions.findIndex(
    (r: any) => r.userId === user.id
  );

  const userName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous";

  if (existingIdx !== -1) {
    // Same reaction → remove it; different → update it
    if (post.reactions[existingIdx].type === reactionType) {
      post.reactions.splice(existingIdx, 1);
    } else {
      post.reactions[existingIdx].type = reactionType;
      post.reactions[existingIdx].userName = userName;
    }
  } else {
    post.reactions.push({ userId: user.id, userName, type: reactionType });
  }

  await post.save();
}

/* ── Delete comment (only comment author) ── */
export async function deleteComment(postId: string, commentId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = (post.comments as any).id(commentId);
  if (!comment) throw new Error("Comment not found");

  if (comment.clerkUserId !== user.id) {
    throw new Error("Forbidden: you can only delete your own comments");
  }

  (post.comments as any).pull({ _id: commentId });
  await post.save();
  revalidatePath("/dashboard");
}

/* ── Add comment ── */
export async function addComment(postId: string, text: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const newComment = {
    clerkUserId: user.id,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    text,
    likes: [],
    replies: [],
    createdAt: new Date(),
  };

  post.comments.push(newComment);
  await post.save();

  // Return the saved comment (with _id) so the client can add it optimistically
  const saved = post.comments[post.comments.length - 1];
  return JSON.parse(JSON.stringify(saved));
}

/* ── Toggle like on comment ── */
export async function toggleCommentLike(postId: string, commentId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = (post.comments as any).id(commentId);
  if (!comment) throw new Error("Comment not found");

  if (!comment.likes) comment.likes = [];

  const idx = comment.likes.indexOf(user.id);
  if (idx === -1) {
    comment.likes.push(user.id);
  } else {
    comment.likes.splice(idx, 1);
  }

  await post.save();
}

/* ── Reply to a comment ── */
export async function addReply(postId: string, commentId: string, text: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = (post.comments as any).id(commentId);
  if (!comment) throw new Error("Comment not found");

  if (!comment.replies) comment.replies = [] as any;

  comment.replies.push({
    clerkUserId: user.id,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    text,
    likes: [],
    createdAt: new Date(),
  });

  await post.save();

  // Return the saved reply (with _id) so the client can update optimistically
  const saved = comment.replies[comment.replies.length - 1];
  return JSON.parse(JSON.stringify(saved));
}

/* ── Toggle like on reply ── */
export async function toggleReplyLike(postId: string, commentId: string, replyId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = (post.comments as any).id(commentId);
  if (!comment) throw new Error("Comment not found");

  if (!comment.replies) comment.replies = [] as any;

  const reply = (comment.replies as any).id(replyId);
  if (!reply) throw new Error("Reply not found");

  if (!reply.likes) reply.likes = [];

  const idx = reply.likes.indexOf(user.id);
  if (idx === -1) {
    reply.likes.push(user.id);
  } else {
    reply.likes.splice(idx, 1);
  }

  await post.save();
}
