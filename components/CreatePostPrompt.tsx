"use client";

import { useState } from "react";
import CreatePostModal from "./CreatePostModal";

interface CreatePostPromptProps {
  userAvatar: string;
  userName: string;
}

export default function CreatePostPrompt({
  userAvatar,
  userName,
}: CreatePostPromptProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-[#0d7cf2]/30 hover:shadow-md"
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7cf2] text-sm font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 rounded-full border border-gray-200 bg-[#f5f7fa] px-4 py-2.5 text-sm text-[#97a4b3]">
          What&apos;s on your mind, {userName.split(" ")[0]}?
        </div>
      </div>

      {showModal && (
        <CreatePostModal
          userAvatar={userAvatar}
          userName={userName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
