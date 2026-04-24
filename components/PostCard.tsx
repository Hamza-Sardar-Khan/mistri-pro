"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  toggleReaction,
  addComment,
  toggleCommentLike,
  addReply,
  toggleReplyLike,
  deletePost,
  deleteComment,
} from "@/lib/actions/post";

/* ── Reaction config ── */
const REACTIONS = [
  { type: "like", emoji: "🩵", label: "Like" },
  { type: "love", emoji: "🔥", label: "Love" },
  { type: "haha", emoji: "🤣", label: "Haha" },
  { type: "wow", emoji: "🤯", label: "Wow" },
  { type: "sad", emoji: "🥺", label: "Sad" },
  { type: "angry", emoji: "💀", label: "Nah" },
] as const;

type ReactionType = (typeof REACTIONS)[number]["type"];

const REACTION_MAP: Record<string, { emoji: string; label: string }> =
  Object.fromEntries(REACTIONS.map((r) => [r.type, { emoji: r.emoji, label: r.label }]));

/* ── Shared types ── */
interface Reaction {
  userId: string;
  userName: string;
  type: string;
}

interface Reply {
  _id: string;
  clerkUserId: string;
  name: string;
  text: string;
  likes: string[];
  createdAt: string;
}

interface Comment {
  _id: string;
  clerkUserId: string;
  name: string;
  text: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
}

interface PostData {
  _id: string;
  authorClerkId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  reactions: Reaction[];
  comments: Comment[];
  createdAt: string;
}

interface PostCardProps {
  post: PostData;
  currentUserId: string;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/* ── Reactions summary badges ── */
function ReactionBadges({
  reactions,
  onClick,
}: {
  reactions: Reaction[];
  onClick: () => void;
}) {
  if (reactions.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topEmojis = sorted.slice(0, 3).map(([t]) => REACTION_MAP[t]?.emoji ?? "👍");

  return (
    <button onClick={onClick} className="flex items-center gap-1 hover:underline">
      <span className="flex -space-x-0.5 text-sm">
        {topEmojis.map((e, i) => (
          <span key={i}>{e}</span>
        ))}
      </span>
      <span>{reactions.length}</span>
    </button>
  );
}

/* ── Reactions detail modal ── */
function ReactionsModal({
  reactions,
  onClose,
}: {
  reactions: Reaction[];
  onClose: () => void;
}) {
  const counts: Record<string, Reaction[]> = {};
  for (const r of reactions) {
    if (!counts[r.type]) counts[r.type] = [];
    counts[r.type].push(r);
  }
  const [tab, setTab] = useState<string>("all");
  const displayed = tab === "all" ? reactions : counts[tab] ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0e1724]">Reactions</h3>
          <button onClick={onClose} className="text-lg text-[#97a4b3] hover:text-[#0e1724]">
            ✕
          </button>
        </div>
        {/* Tabs */}
        <div className="mb-3 flex gap-1 overflow-x-auto border-b border-gray-100 pb-2">
          <button
            onClick={() => setTab("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              tab === "all" ? "bg-[#0d7cf2] text-white" : "bg-gray-100 text-[#5e6d80]"
            }`}
          >
            All {reactions.length}
          </button>
          {Object.entries(counts).map(([type, arr]) => (
            <button
              key={type}
              onClick={() => setTab(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tab === type ? "bg-[#0d7cf2] text-white" : "bg-gray-100 text-[#5e6d80]"
              }`}
            >
              {REACTION_MAP[type]?.emoji ?? "👍"} {arr.length}
            </button>
          ))}
        </div>
        {/* List */}
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {displayed.map((r, i) => (
            <div key={`${r.userId}-${i}`} className="flex items-center justify-between">
              <span className="text-sm text-[#2d3a4a]">{r.userName}</span>
              <span className="text-base">{REACTION_MAP[r.type]?.emoji ?? "👍"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Reply Item ── */
function ReplyItem({
  reply,
  postId,
  commentId,
  currentUserId,
}: {
  reply: Reply;
  postId: string;
  commentId: string;
  currentUserId: string;
}) {
  const [likes, setLikes] = useState(reply.likes ?? []);
  const liked = likes.includes(currentUserId);

  const handleLike = async () => {
    setLikes((prev) =>
      prev.includes(currentUserId)
        ? prev.filter((id) => id !== currentUserId)
        : [...prev, currentUserId]
    );
    try {
      await toggleReplyLike(postId, commentId, reply._id);
    } catch {
      setLikes(reply.likes ?? []);
    }
  };

  return (
    <div className="ml-10 flex gap-2">
      <Link
        href={`/profile/${reply.clerkUserId}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-[#5e6d80] transition hover:ring-2 hover:ring-[#0d7cf2]/30"
      >
        {reply.name.charAt(0).toUpperCase()}
      </Link>
      <div className="flex-1">
        <div className="rounded-xl bg-[#f5f7fa] px-3 py-2">
          <Link
            href={`/profile/${reply.clerkUserId}`}
            className="text-xs font-semibold text-[#0e1724] transition hover:text-[#0d7cf2]"
          >
            {reply.name}
          </Link>
          <p className="text-[13px] text-[#2d3a4a]">{reply.text}</p>
        </div>
        <div className="mt-0.5 flex items-center gap-3 pl-2 text-[11px] text-[#97a4b3]">
          <span>{timeAgo(reply.createdAt)}</span>
          <button
            onClick={handleLike}
            className={`font-semibold hover:underline ${liked ? "text-[#0d7cf2]" : ""}`}
          >
            Like{likes.length > 0 && ` (${likes.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Comment Item ── */
function CommentItem({
  comment,
  postId,
  currentUserId,
  onDeleted,
}: {
  comment: Comment;
  postId: string;
  currentUserId: string;
  onDeleted: (id: string) => void;
}) {
  const safeCommentLikes = comment.likes ?? [];
  const safeCommentReplies = comment.replies ?? [];
  const [likes, setLikes] = useState(safeCommentLikes);
  const [optimisticReplies, setOptimisticReplies] = useState<Reply[]>(safeCommentReplies);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const liked = likes.includes(currentUserId);
  const isOwner = comment.clerkUserId === currentUserId;

  const handleLike = async () => {
    setLikes((prev) =>
      prev.includes(currentUserId)
        ? prev.filter((id) => id !== currentUserId)
        : [...prev, currentUserId]
    );
    try {
      await toggleCommentLike(postId, comment._id);
    } catch {
      setLikes(safeCommentLikes);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteComment(postId, comment._id);
      onDeleted(comment._id);
    } catch (err) {
      setDeleting(false);
      console.error(err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    const text = replyText;
    setReplyText("");
    try {
      const saved = await addReply(postId, comment._id, text);
      if (saved) {
        setOptimisticReplies((prev) => [...prev, saved]);
      }
      setShowReplyInput(false);
      setShowReplies(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  if (deleting) return null;

  return (
    <div>
      <div className="flex gap-2">
        <Link
          href={`/profile/${comment.clerkUserId}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-[#5e6d80] transition hover:ring-2 hover:ring-[#0d7cf2]/30"
        >
          {comment.name.charAt(0).toUpperCase()}
        </Link>
        <div className="group flex-1">
          <div className="flex items-start gap-1">
            <div className="rounded-xl bg-[#f5f7fa] px-3 py-2">
              <Link
                href={`/profile/${comment.clerkUserId}`}
                className="text-xs font-semibold text-[#0e1724] transition hover:text-[#0d7cf2]"
              >
                {comment.name}
              </Link>
              <p className="text-sm text-[#2d3a4a]">{comment.text}</p>
            </div>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="mt-1 hidden rounded-full p-1 text-[#97a4b3] transition hover:bg-red-50 hover:text-red-500 group-hover:block"
                title="Delete comment"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 pl-2 text-[11px] text-[#97a4b3]">
            <span>{timeAgo(comment.createdAt)}</span>
            <button
              onClick={handleLike}
              className={`font-semibold hover:underline ${liked ? "text-[#0d7cf2]" : ""}`}
            >
              Like{likes.length > 0 && ` (${likes.length})`}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="font-semibold hover:underline"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies toggle */}
      {optimisticReplies.length > 0 && (
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="ml-10 mt-1 text-[11px] font-semibold text-[#0d7cf2] hover:underline"
        >
          {showReplies
            ? "Hide replies"
            : `View ${optimisticReplies.length} ${optimisticReplies.length === 1 ? "reply" : "replies"}`}
        </button>
      )}

      {/* Replies list */}
      {showReplies && (
        <div className="mt-2 space-y-2">
          {optimisticReplies.map((r) => (
            <ReplyItem
              key={r._id}
              reply={r}
              postId={postId}
              commentId={comment._id}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReplyInput && (
        <div className="ml-10 mt-2 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            placeholder={`Reply to ${comment.name.split(" ")[0]}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            className="flex-1 rounded-full border border-gray-200 bg-[#f5f7fa] px-3 py-1.5 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2]"
          />
          <button
            onClick={handleReply}
            disabled={isReplying || !replyText.trim()}
            className="rounded-full bg-[#0d7cf2] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0b6ad4] disabled:opacity-50"
          >
            {isReplying ? "..." : "Reply"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Post Card ── */
export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>(post.comments);
  const [deleted, setDeleted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reactions
  const [reactions, setReactions] = useState<Reaction[]>(post.reactions ?? []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myReaction = reactions.find((r) => r.userId === currentUserId);

  const handleReaction = async (type: ReactionType) => {
    setShowReactionPicker(false);
    setReactions((prev) => {
      const without = prev.filter((r) => r.userId !== currentUserId);
      if (myReaction?.type === type) return without;
      return [...without, { userId: currentUserId, userName: "You", type }];
    });
    try {
      await toggleReaction(post._id, type);
    } catch {
      setReactions(post.reactions ?? []);
    }
  };

  const handleLikeClick = () => handleReaction("like");

  const onHoverEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowReactionPicker(true), 400);
  };
  const onHoverLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowReactionPicker(false), 300);
  };

  const isOwner = post.authorClerkId === currentUserId;

  const handleDelete = async () => {
    setDeleted(true);
    try {
      await deletePost(post._id);
    } catch (err) {
      setDeleted(false);
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    const text = commentText;
    setCommentText("");
    try {
      const saved = await addComment(post._id, text);
      if (saved) {
        setOptimisticComments((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setOptimisticComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  if (deleted) return null;

  const totalComments = optimisticComments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Author header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <Link
          href={`/profile/${post.authorClerkId}`}
          className="flex min-w-0 flex-1 items-center gap-3 group"
        >
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover transition group-hover:ring-2 group-hover:ring-[#0d7cf2]/30" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white transition group-hover:ring-2 group-hover:ring-[#0d7cf2]/30">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0e1724] transition group-hover:text-[#0d7cf2]">{post.authorName}</p>
            <p className="text-xs text-[#97a4b3]">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {isOwner && (
          <div className="relative">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-full p-1.5 text-[#97a4b3] transition hover:bg-red-50 hover:text-red-500"
                title="Delete post"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-600">Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-[#5e6d80] transition hover:bg-gray-50">Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-5 py-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2d3a4a]">{post.content}</p>
        </div>
      )}

      {/* Media */}
      {post.imageUrl && (
        <div className="px-5 pb-2">
          <img src={post.imageUrl} alt="post image" loading="lazy" decoding="async" className="w-full rounded-lg object-cover" />
        </div>
      )}
      {post.videoUrl && (
        <div className="px-5 pb-2">
          <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16/9" }}>
            <video src={post.videoUrl} controls preload="none" className="absolute inset-0 h-full w-full object-contain" />
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2 text-xs text-[#97a4b3]">
        <div>
          <ReactionBadges reactions={reactions} onClick={() => setShowReactionsModal(true)} />
        </div>
        <div>
          {totalComments > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:underline">
              {totalComments} {totalComments === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-gray-100">
        {/* Reaction button with hover picker */}
        <div className="relative flex flex-1" onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>
          {showReactionPicker && (
            <div className="absolute -top-11 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-lg">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  className="transform text-xl transition hover:scale-125"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleLikeClick}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition hover:bg-gray-50 ${
              myReaction ? "text-[#0d7cf2]" : "text-[#5e6d80]"
            }`}
          >
            <span className="text-base">
              {myReaction ? REACTION_MAP[myReaction.type]?.emoji ?? "👍" : "👍"}
            </span>
            {myReaction ? REACTION_MAP[myReaction.type]?.label ?? "Like" : "Like"}
          </button>
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-2 border-l border-gray-100 py-2.5 text-sm font-medium text-[#5e6d80] transition hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-100 px-5 py-3">
          {optimisticComments.length > 0 && (
            <div className="mb-3 space-y-3">
              {optimisticComments.map((c) => (
                <CommentItem
                  key={c._id}
                  comment={c}
                  postId={post._id}
                  currentUserId={currentUserId}
                  onDeleted={handleCommentDeleted}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              className="flex-1 rounded-full border border-gray-200 bg-[#f5f7fa] px-4 py-2 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2]"
            />
            <button
              onClick={handleComment}
              disabled={isCommenting || !commentText.trim()}
              className="rounded-full bg-[#0d7cf2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0b6ad4] disabled:opacity-50"
            >
              {isCommenting ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Reactions modal */}
      {showReactionsModal && (
        <ReactionsModal reactions={reactions} onClose={() => setShowReactionsModal(false)} />
      )}
    </div>
  );
}
