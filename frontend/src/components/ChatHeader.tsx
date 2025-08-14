"use client";

import {
  BiMenu,
  BiBulb,
  BiUpload,
  BiDownload,
  BiCog,
  BiX,
} from "react-icons/bi";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chatMode: string;
  currentChatTitle: string;
  onExportChat: () => void;
  onOpenSettings: () => void;
  onUploadFile: () => void;
  onDeleteAllDocuments: () => void;
  isDeletingDocuments: boolean;
  messagesLength: number;
}

export default function ChatHeader({
  sidebarOpen,
  setSidebarOpen,
  chatMode,
  currentChatTitle,
  onExportChat,
  onOpenSettings,
  onUploadFile,
  onDeleteAllDocuments,
  isDeletingDocuments,
  messagesLength,
}: ChatHeaderProps) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <BiMenu className="w-5 h-5 text-gray-300" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BiBulb className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-semibold text-gray-100">
                  RAG Assistant
                </h1>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                  <p className="text-xs text-gray-400 capitalize font-bold">
                    {chatMode}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={onUploadFile}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-gray-700 hover:border-gray-600 flex items-center"
            >
              <BiUpload className="w-4 h-4 mr-2" />
              Upload Document
            </button>

            {messagesLength > 0 && (
              <button
                onClick={onExportChat}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-gray-700 hover:border-gray-600 flex items-center"
              >
                <BiDownload className="w-4 h-4 mr-2" />
                Export
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-gray-700 hover:border-gray-600"
              aria-label="Settings"
            >
              <BiCog className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col space-y-3 min-w-0">
        {/* Top row */}
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <BiMenu className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                <BiBulb className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-100 truncate">
                  RAG Assistant
                </h1>
                <p className="text-xs text-gray-400 truncate capitalize font-bold">
                  {chatMode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={onUploadFile}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-gray-700 hover:border-gray-600 flex items-center"
            >
              <BiUpload className="w-4 h-4 mr-1" />
              Upload
            </button>

            {messagesLength > 0 && (
              <button
                onClick={onExportChat}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-gray-700 hover:border-gray-600 flex items-center"
              >
                <BiDownload className="w-4 h-4 mr-1" />
                Export
              </button>
            )}
          </div>

          <button
            onClick={onOpenSettings}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-gray-700 hover:border-gray-600"
            aria-label="Settings"
          >
            <BiCog className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
