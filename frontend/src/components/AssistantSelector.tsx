"use client";

import { useState, useEffect } from "react";
import { api, AssistantInfo } from "../lib/api";

interface AssistantSelectorProps {
  selectedAssistant: string;
  onAssistantChange: (assistant: string) => void;
  className?: string;
}

export default function AssistantSelector({
  selectedAssistant,
  onAssistantChange,
  className = "",
}: AssistantSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistants, setAssistants] = useState<AssistantInfo[]>([]);

  useEffect(() => {
    const loadAssistants = async () => {
      try {
        setIsLoading(true);
        const response = await api.getAvailableAssistants();
        setAssistants(response.assistants);
      } catch (err) {
        console.error("Failed to load assistants:", err);
        setError("Failed to load available assistants");
      } finally {
        setIsLoading(false);
      }
    };

    loadAssistants();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-400">Loading assistants...</span>
      </div>
    );
  }

  if (error) {
    return <div className={`text-sm text-red-400 ${className}`}>{error}</div>;
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-300">
        🤖 AI Assistant
      </label>
      <div className="grid grid-cols-1 gap-2">
        {assistants.map((assistant) => (
          <button
            key={assistant.id}
            onClick={() => onAssistantChange(assistant.id)}
            className={`p-3 rounded-lg border transition-all duration-200 text-left ${
              selectedAssistant === assistant.id
                ? "border-blue-500 bg-blue-500/10 text-blue-300"
                : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
            }`}
          >
            <div className="font-medium text-sm">{assistant.name}</div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              {assistant.description}
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        💡 The AI assistant can analyze your documents and search the web for
        current information
      </div>
    </div>
  );
}
