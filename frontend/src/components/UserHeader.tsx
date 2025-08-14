"use client";

import Image from "next/image";
import { useState } from "react";
import { useUser } from "./AuthWrapper";
import { BiLogOut } from "react-icons/bi";

export default function UserHeader() {
  const { user, logout } = useUser();
  const [imageError, setImageError] = useState(false);

  // Get the first letter for the avatar fallback
  const getInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  return (
    <div className="flex items-center justify-between space-x-2 bg-gray-700 rounded-lg px-3 py-2 min-w-0 flex-shrink-0">
      <div className="flex items-center space-x-2">
        {/* Avatar - with fallback to first letter */}
        {user?.avatar_url && !imageError ? (
          <div className="relative w-6 h-6">
            <Image
              src={user.avatar_url}
              alt={getDisplayName()}
              fill
              className="rounded-full object-cover"
              onError={() => setImageError(true)}
              sizes="24px"
            />
          </div>
        ) : null}

        {/* Fallback avatar with first letter */}
        <div
          className={`w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center ${
            user?.avatar_url && !imageError ? "hidden" : ""
          }`}
        >
          <span className="text-white text-xs font-bold">{getInitials()}</span>
        </div>

        {/* User name - hidden on very small screens */}
        <div className="text-sm hidden sm:block min-w-0">
          <p className="text-gray-200 font-medium truncate max-w-24">
            {getDisplayName()}
          </p>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer p-1"
        title="Logout"
      >
        <BiLogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
