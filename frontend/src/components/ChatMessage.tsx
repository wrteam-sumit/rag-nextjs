"use client";

import { Message } from "../types/chat";
import { BiFile, BiUser, BiBulb, BiRefresh } from "react-icons/bi";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

export default function ChatMessage({
  message,
  onRegenerate,
  canRegenerate,
}: ChatMessageProps) {
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSources = () => {
    if (!message.sources || message.sources.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <h4 className="text-sm font-medium text-gray-200 mb-2 flex items-center">
          <BiFile className="w-4 h-4 mr-2" />
          Sources ({message.sources.length})
        </h4>
        <div className="space-y-2 max-w-full">
          {message.sources.map((source, index) => (
            <div key={index} className="text-sm min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 min-w-0">
                <span className="text-gray-300 break-words overflow-hidden url-text min-w-0 flex-1">
                  {source.filename}
                </span>
                <span className="text-gray-500 flex-shrink-0">
                  {Math.round(parseFloat(source.relevance) * 100)}% relevant
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    if (!message.metadata) return null;

    const { searchMethod, aiMethod, modelUsed, webSearchUsed } =
      message.metadata;

    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 overflow-hidden">
        {modelUsed && (
          <span className="px-2 py-1 bg-gray-800 rounded-full border border-gray-700 break-words">
            {modelUsed}
          </span>
        )}
        {searchMethod && (
          <span className="px-2 py-1 bg-gray-800 rounded-full border border-gray-700 break-words">
            {searchMethod}
          </span>
        )}
        {aiMethod && (
          <span className="px-2 py-1 bg-gray-800 rounded-full border border-gray-700 break-words">
            {aiMethod}
          </span>
        )}
        {webSearchUsed && (
          <span className="px-2 py-1 bg-blue-900 rounded-full border border-blue-700 text-blue-300 break-words">
            Web Search
          </span>
        )}
      </div>
    );
  };

  if (message.type === "user") {
    return (
      <div className="flex justify-end mb-6 min-w-0">
        <div className="max-w-3xl w-full min-w-0">
          <div className="flex items-start space-x-3">
            <div className="flex-1" />
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl px-4 py-3 shadow-sm max-w-full">
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden content-wrapper">
                {message.content}
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <BiUser className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-6 min-w-0">
      <div className="max-w-3xl w-full min-w-0">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <BiBulb className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-sm max-w-full">
              <div className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap break-words overflow-hidden content-wrapper">
                {message.content}
              </div>
            </div>

            {renderSources()}
            {renderMetadata()}

            {/* Regenerate Button */}
            {canRegenerate && onRegenerate && (
              <div className="mt-3">
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <BiRefresh className="w-4 h-4" />
                  <span>Regenerate response</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex mt-2">
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
