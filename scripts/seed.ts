// Run with: npx tsx scripts/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;

const ReactionSchema = new mongoose.Schema(
  {
    userId: String,
    userName: String,
    type: String,
  },
  { _id: false }
);

const ReplySchema = new mongoose.Schema(
  {
    clerkUserId: String,
    name: String,
    text: String,
    likes: [String],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CommentSchema = new mongoose.Schema(
  {
    clerkUserId: String,
    name: String,
    text: String,
    likes: [String],
    replies: [ReplySchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PostSchema = new mongoose.Schema(
  {
    authorClerkId: String,
    authorName: String,
    authorAvatar: String,
    content: String,
    imageUrl: String,
    videoUrl: String,
    reactions: [ReactionSchema],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

const dummyPosts = [
  {
    authorClerkId: "demo_user_1",
    authorName: "Ahmed Khan",
    authorAvatar: "",
    content:
      "Just finished a full kitchen renovation in Lahore. Marble countertops, custom cabinets, and modern lighting. The client was thrilled! 🔨✨ #KitchenRenovation #MistriPro",
    imageUrl:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    reactions: [
      { userId: "demo_user_2", userName: "Sara Ali", type: "love" },
      { userId: "demo_user_3", userName: "Bilal Hussain", type: "like" },
      { userId: "demo_user_4", userName: "Usman Tariq", type: "wow" },
      { userId: "demo_user_5", userName: "Fatima Noor", type: "love" },
    ],
    comments: [
      {
        clerkUserId: "demo_user_2",
        name: "Sara Ali",
        text: "This looks amazing! Great craftsmanship 👏",
        likes: [],
        replies: [],
        createdAt: new Date("2026-02-28T10:30:00Z"),
      },
      {
        clerkUserId: "demo_user_3",
        name: "Bilal Hussain",
        text: "How long did this project take?",
        likes: [],
        replies: [],
        createdAt: new Date("2026-02-28T12:00:00Z"),
      },
    ],
  },
  {
    authorClerkId: "demo_user_2",
    authorName: "Sara Ali",
    authorAvatar: "",
    content:
      "Looking for a reliable electrician in Islamabad for a commercial wiring project. Must have experience with three-phase installations. Budget is flexible for quality work. DM me if interested!",
    reactions: [
      { userId: "demo_user_1", userName: "Ahmed Khan", type: "like" },
      { userId: "demo_user_3", userName: "Bilal Hussain", type: "haha" },
    ],
    comments: [
      {
        clerkUserId: "demo_user_4",
        name: "Usman Tariq",
        text: "I have 10 years experience in commercial wiring. Sending you a DM!",
        likes: [],
        replies: [],
        createdAt: new Date("2026-02-27T15:45:00Z"),
      },
    ],
  },
  {
    authorClerkId: "demo_user_3",
    authorName: "Bilal Hussain",
    authorAvatar: "",
    content:
      "Pro tip for fellow plumbers: Always pressure-test your joints before closing up walls. Saved myself from a massive callback today. Prevention > cure! 💧🔧",
    reactions: [
      { userId: "demo_user_1", userName: "Ahmed Khan", type: "wow" },
      { userId: "demo_user_2", userName: "Sara Ali", type: "like" },
      { userId: "demo_user_4", userName: "Usman Tariq", type: "love" },
      { userId: "demo_user_5", userName: "Fatima Noor", type: "sad" },
      { userId: "demo_user_6", userName: "Hassan Raza", type: "angry" },
      { userId: "demo_user_7", userName: "Zainab Shah", type: "haha" },
    ],
    comments: [],
  },
  {
    authorClerkId: "demo_user_4",
    authorName: "Usman Tariq",
    authorAvatar: "",
    content:
      "Completed a full home electrical rewiring today. Old aluminum wiring replaced with copper throughout. Safety first! Here's the before and after of the main panel.",
    imageUrl:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
    reactions: [
      { userId: "demo_user_1", userName: "Ahmed Khan", type: "love" },
      { userId: "demo_user_3", userName: "Bilal Hussain", type: "like" },
      { userId: "demo_user_5", userName: "Fatima Noor", type: "wow" },
    ],
    comments: [
      {
        clerkUserId: "demo_user_1",
        name: "Ahmed Khan",
        text: "Clean work bhai! That panel looks professional 🔥",
        likes: [],
        replies: [],
        createdAt: new Date("2026-02-26T09:20:00Z"),
      },
    ],
  },
  {
    authorClerkId: "demo_user_5",
    authorName: "Fatima Noor",
    authorAvatar: "",
    content:
      "Just launched my painting & wall design business on Mistri Pro! Specialising in textured walls, accent walls, and creative murals. Serving Karachi and surrounding areas. 🎨🏠\n\nFirst 5 clients get 15% off!",
    imageUrl:
      "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
    reactions: [
      { userId: "demo_user_2", userName: "Sara Ali", type: "love" },
      { userId: "demo_user_3", userName: "Bilal Hussain", type: "love" },
      { userId: "demo_user_1", userName: "Ahmed Khan", type: "like" },
      { userId: "demo_user_4", userName: "Usman Tariq", type: "haha" },
      { userId: "demo_user_6", userName: "Hassan Raza", type: "wow" },
    ],
    comments: [
      {
        clerkUserId: "demo_user_2",
        name: "Sara Ali",
        text: "Love the accent wall work! Bookmarking this 😍",
        likes: [],
        replies: [],
        createdAt: new Date("2026-02-25T18:00:00Z"),
      },
    ],
  },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  // Clear existing posts
  await Post.deleteMany({});
  console.log("Cleared existing posts.");

  // Insert dummy posts
  await Post.insertMany(dummyPosts);
  console.log(`Inserted ${dummyPosts.length} dummy posts.`);

  await mongoose.disconnect();
  console.log("Done! Disconnected.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
