"use client";

import { useState, useRef, useEffect } from "react";
import { BiSend, BiLoaderAlt } from "react-icons/bi";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4 min-w-0">
      <div className="max-w-4xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="relative">
          {/* Input Container */}
          <div className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-lg flex items-center">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isLoading || disabled}
              className="w-full bg-transparent text-gray-100 placeholder-gray-400 resize-none outline-none p-4 pr-20 text-sm leading-6 min-h-[52px] max-h-[200px]"
              rows={1}
            />

            {/* Action Buttons */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              {/* Send Button */}
              <button
                type="submit"
                disabled={!message.trim() || isLoading || disabled}
                className={`h-10 w-10 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  message.trim() && !isLoading && !disabled
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
                title="Send message"
              >
                {isLoading ? (
                  <BiLoaderAlt className="w-5 h-5 animate-spin" />
                ) : (
                  <BiSend className="text-2xl" />
                )}
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              RAG Assistant can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
