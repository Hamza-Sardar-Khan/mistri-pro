"use server";

import connectDB from "@/lib/db";
import Contract from "@/models/Contract";
import Review from "@/models/Review";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function getReceivedReviews(clerkUserId: string) {
  await connectDB();
  const reviews = await Review.find({ revieweeClerkId: clerkUserId })
    .sort({ createdAt: -1 })
    .lean();
  return serialize(reviews);
}

export async function getUserReviewStats(clerkUserId: string) {
  await connectDB();

  const [ratingStats, roleStats, completedJobs] = await Promise.all([
    Review.aggregate([
      { $match: { revieweeClerkId: clerkUserId } },
      {
        $group: {
          _id: "$revieweeClerkId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]),
    Review.aggregate([
      { $match: { revieweeClerkId: clerkUserId } },
      {
        $group: {
          _id: "$role",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]),
    Contract.countDocuments({ workerClerkId: clerkUserId, status: "completed" }),
  ]);

  const sellerStats = roleStats.find((item) => item._id === "client-to-worker");
  const clientStats = roleStats.find((item) => item._id === "worker-to-client");

  return {
    averageRating: Number(ratingStats[0]?.averageRating ?? 0),
    reviewCount: Number(ratingStats[0]?.reviewCount ?? 0),
    sellerAverageRating: Number(sellerStats?.averageRating ?? 0),
    sellerReviewCount: Number(sellerStats?.reviewCount ?? 0),
    clientAverageRating: Number(clientStats?.averageRating ?? 0),
    clientReviewCount: Number(clientStats?.reviewCount ?? 0),
    completedJobs,
  };
}
