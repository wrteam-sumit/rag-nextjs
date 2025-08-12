"use client";

import { useState, useEffect } from "react";
import { api, DomainInfo } from "../lib/api";

interface DomainSelectorProps {
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  className?: string;
}

export default function DomainSelector({
  selectedDomain,
  onDomainChange,
  className = "",
}: DomainSelectorProps) {
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setIsLoading(true);
        const response = await api.getAvailableDomains();
        setDomains(response.domains);
      } catch (err) {
        console.error("Failed to load domains:", err);
        setError("Failed to load available domains");
      } finally {
        setIsLoading(false);
      }
    };

    loadDomains();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-400">Loading domains...</span>
      </div>
    );
  }

  if (error) {
    return <div className={`text-sm text-red-400 ${className}`}>{error}</div>;
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-300">
        🎯 Select AI Assistant
      </label>
      <div className="grid grid-cols-2 gap-2">
        {domains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => onDomainChange(domain.id)}
            className={`p-3 rounded-lg border transition-all duration-200 text-left ${
              selectedDomain === domain.id
                ? "border-blue-500 bg-blue-500/10 text-blue-300"
                : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
            }`}
          >
            <div className="font-medium text-sm">{domain.name}</div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              {domain.description}
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        💡 The AI will auto-detect the best domain if none is selected
      </div>
    </div>
  );
}
