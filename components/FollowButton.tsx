"use client";

import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { followUser, unfollowUser } from "@/lib/actions/user";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const data = isFollowing
          ? await unfollowUser(targetUserId)
          : await followUser(targetUserId);
          
        setIsFollowing(data.isFollowing);
        router.refresh();
      } catch (error) {
        console.error("Follow error:", error);
        alert("Failed to update follow state. Please try again.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        isFollowing
          ? "border border-gray-200 text-[#0e1724] hover:bg-gray-50"
          : "bg-[#0d7cf2] text-white hover:bg-[#0b6ad4]"
      } ${isPending ? "opacity-70" : ""}`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
