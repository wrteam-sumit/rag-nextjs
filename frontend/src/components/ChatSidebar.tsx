"use client";

import { ChatSession } from "../types/chat";
import UserHeader from "./UserHeader";
import { BiX, BiPlus, BiTrash } from "react-icons/bi";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  chatSessions: ChatSession[];
  currentChatId: string;
  onCreateNewChat: () => void;
  onSwitchChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onCloseSidebar: () => void;
}

export default function ChatSidebar({
  sidebarOpen,
  chatSessions,
  currentChatId,
  onCreateNewChat,
  onSwitchChat,
  onDeleteChat,
  onCloseSidebar,
}: ChatSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}/${day}/${year}`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:absolute inset-y-0 left-0 z-50 w-80 max-w-[85vw] md:max-w-none bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "md:relative" : "md:absolute"
        }`}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Chats</h2>
          <button
            onClick={onCloseSidebar}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <BiX className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Sidebar Header - ChatGPT Style */}
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={onCreateNewChat}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg py-3 px-4 transition-all text-sm font-medium flex items-center justify-center cursor-pointer border border-gray-700 hover:border-gray-600"
          >
            <BiPlus className="w-4 h-4 mr-2" />
            New chat
          </button>
        </div>

        {/* Chat List - ChatGPT Style */}
        <div className="flex-1 overflow-y-auto">
          {chatSessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-400 text-sm">No chat sessions yet</p>
              <p className="text-gray-500 text-xs mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            <div className="p-2">
              {chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative p-3 rounded-lg cursor-pointer mb-1 transition-all duration-200 ${
                    currentChatId === chat.id
                      ? "bg-gray-800 border border-gray-600"
                      : "hover:bg-gray-800 hover:border-gray-700 border border-transparent"
                  }`}
                  onClick={() => {
                    onSwitchChat(chat.id);
                    if (window.innerWidth < 768) {
                      onCloseSidebar();
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-100 truncate">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(chat.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all duration-200"
                      aria-label="Delete chat"
                    >
                      <BiTrash className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile - Bottom */}
        <div className="border-t border-gray-800 p-4">
          <UserHeader />
        </div>
      </div>
    </>
  );
}
