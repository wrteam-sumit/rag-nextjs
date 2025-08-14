"use client";

export default function LoadingIndicator() {
  return (
    <div className="flex justify-start mb-6">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-300 font-medium">
              AI is thinking...
            </span>
            <span className="text-xs text-gray-500">
              Searching documents and generating response
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
