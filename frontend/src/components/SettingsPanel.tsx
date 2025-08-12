"use client";

import DomainSelector from "./DomainSelector";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  useWebSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  chatMode: string;
  onChatModeChange: (mode: string) => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  selectedDomain,
  onDomainChange,
  useWebSearch,
  onWebSearchChange,
  chatMode,
  onChatModeChange,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">
            ⚙️ AI Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Chat Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              💬 Chat Mode
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onChatModeChange("document")}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  chatMode === "document"
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
                }`}
              >
                <div className="font-medium text-sm">📄 Document RAG</div>
                <div className="text-xs text-gray-400 mt-1">
                  Ask questions about uploaded documents
                </div>
              </button>
              <button
                onClick={() => onChatModeChange("web")}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  chatMode === "web"
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
                }`}
              >
                <div className="font-medium text-sm">🌐 Web Search</div>
                <div className="text-xs text-gray-400 mt-1">
                  Search the web for current information
                </div>
              </button>
              <button
                onClick={() => onChatModeChange("hybrid")}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  chatMode === "hybrid"
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
                }`}
              >
                <div className="font-medium text-sm">🔄 Hybrid Mode</div>
                <div className="text-xs text-gray-400 mt-1">
                  Use documents first, then web search if needed
                </div>
              </button>
            </div>
          </div>

          {/* Domain Selection */}
          <DomainSelector
            selectedDomain={selectedDomain}
            onDomainChange={onDomainChange}
          />

          {/* Web Search Toggle - Only show for hybrid mode */}
          {chatMode === "hybrid" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                🌐 Web Search Fallback
              </label>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="text-sm text-gray-200">
                    Enable web search fallback
                  </div>
                  <div className="text-xs text-gray-400">
                    Search the web when documents don&apos;t have enough
                    information
                  </div>
                </div>
                <button
                  onClick={() => onWebSearchChange(!useWebSearch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useWebSearch ? "bg-blue-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useWebSearch ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Current Settings Summary */}
          <div className="bg-gray-700 rounded-lg p-3">
            <h3 className="text-sm font-medium text-gray-200 mb-2">
              Current Settings
            </h3>
            <div className="space-y-1 text-xs text-gray-400">
              <div>
                💬 Chat Mode:{" "}
                {chatMode === "document"
                  ? "Document RAG"
                  : chatMode === "web"
                  ? "Web Search"
                  : "Hybrid"}
              </div>
              <div>
                🎯 AI Assistant:{" "}
                {selectedDomain === "general" ? "Auto-detect" : selectedDomain}
              </div>
              {chatMode === "hybrid" && (
                <div>
                  🌐 Web Search: {useWebSearch ? "Enabled" : "Disabled"}
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
