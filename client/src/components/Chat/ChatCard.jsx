"use client";
import { getProfilePicUrl } from "@/utils/profilePic";
import { useTruncateMessage } from "@/utils/hooks";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

// Helper: get initial and random color for fallback avatar
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "U");
const getColor = (name) => {
  if (!name) return "#6c757d";
  const colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#3f51b5",
    "#2196f3",
    "#009688",
    "#4caf50",
    "#ff9800",
    "#795548",
    "#607d8b",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ChatCard = ({ user, AllData }) => {
  // All hooks must be called unconditionally first
  const [message, truncateMessage] = useTruncateMessage(5);

  // Handle user status in useEffect (not during render)
  const showUserStatus = user?.status === "offline";

  // Truncate message only if content exists
  useEffect(() => {
    const content = "Hello buddy how are you" || null;
    if (content) {
      truncateMessage(content);
    }
  }, []); // Empty dependency: runs once on mount

  // Return null only AFTER hooks
  if (!user) return null;
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Last seen unknown";
    return `Last seen ${dayjs(timestamp).fromNow()}`;
  };

  return (
    <div className="bg-[#1A3636] dark:bg-[#1A2A2A] border-b border-white dark:border-gray-600 border-[5] m-2 p-1 flex flex-col w-100 rounded-md h-14 hover:cursor-pointer hover:bg-[#254545] dark:hover:bg-[#2A3A3A] transition-colors duration-300">
      <div className="flex text-white dark:text-gray-200 flex-row items-center justify-evenly w-full">
        {getProfilePicUrl(user.profilePic, "small") ? (
          <img
            src={getProfilePicUrl(user.profilePic, "small")}
            alt="user profile"
            className="w-10 h-10 border-2 border-[#40534C] dark:border-[#304540] rounded-full object-cover transition-colors duration-300"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-[#40534C] dark:border-[#304540] transition-colors duration-300"
            style={{ backgroundColor: getColor(user?.name) }}
            title={user?.name}
          >
            {getInitial(user?.name)}
          </div>
        )}
        <div className="grid grid-cols-2 ml-2 gap-y-1 p-1">
          <span className="text-white dark:text-gray-200 text-sm text-left font-bold transition-colors duration-300">
            {user.name}
          </span>
          <span className="text-white dark:text-gray-200 text-sm text-right transition-colors duration-300">
            {user.status}
          </span>
          {/* Truncate message */}
          <span className="text-gray-400 dark:text-gray-500 text-nowrap text-[12px] text-left transition-colors duration-300">
            {message}
          </span>
          {showUserStatus && (
            <span className="text-gray-400 dark:text-gray-500 text-[12px] text-right mr-[-10px] transition-colors duration-300">
              {user.lastSeen ? formatLastSeen(user.lastSeen) : "Offline"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatCard;
