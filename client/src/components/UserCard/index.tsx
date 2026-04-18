"use client";

import React from "react";
import Image from "next/image";
import { User } from "@/state/api";

type Props = {
  user: User;
};

const UserCard = ({ user }: Props) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
          {user.profilePictureUrl ? (
            <Image
              src={`https://pm-s3-images.s3.us-east-2.amazonaws.com/${user.profilePictureUrl}`}
              alt={user.username}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
          <p className="text-sm text-gray-500">User ID: {user.userId}</p>
        </div>
      </div>
    </div>
  );
};

export default UserCard;