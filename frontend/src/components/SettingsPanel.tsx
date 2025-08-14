"use client";

import AssistantSelector from "./AssistantSelector";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssistant: string;
  onAssistantChange: (assistant: string) => void;
  useWebSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  chatMode: string;
  onChatModeChange: (mode: string) => void;
  onClearAllData: () => void;
  isClearingData: boolean;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  selectedAssistant,
  onAssistantChange,
  useWebSearch,
  onWebSearchChange,
  chatMode,
  onChatModeChange,
  onClearAllData,
  isClearingData,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
                <div className="font-medium text-sm">📄 Document Mode</div>
                <div className="text-xs text-gray-400 mt-1">
                  Ask questions about your uploaded documents
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

          {/* Assistant Selection */}
          <AssistantSelector
            selectedAssistant={selectedAssistant}
            onAssistantChange={onAssistantChange}
          />

          {/* Web Search Toggle - Only show for hybrid mode */}
          {chatMode === "hybrid" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                🌐 Web Search
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onWebSearchChange(true)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                    useWebSearch
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
                  }`}
                >
                  Enabled
                </button>
                <button
                  onClick={() => onWebSearchChange(false)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                    !useWebSearch
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-200"
                  }`}
                >
                  Disabled
                </button>
              </div>
              <div className="text-xs text-gray-500">
                When enabled, the AI will search the web for additional
                information when your documents don&apos;t contain enough
                context.
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              ⌨️ Keyboard Shortcuts
            </label>
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                • <kbd className="bg-gray-700 px-1 rounded">Ctrl/Cmd + N</kbd>{" "}
                New chat
              </div>
              <div>
                • <kbd className="bg-gray-700 px-1 rounded">Ctrl/Cmd + K</kbd>{" "}
                Focus input
              </div>
              <div>
                • <kbd className="bg-gray-700 px-1 rounded">Ctrl/Cmd + U</kbd>{" "}
                Upload file
              </div>
              <div>
                • <kbd className="bg-gray-700 px-1 rounded">Ctrl/Cmd + B</kbd>{" "}
                Toggle sidebar
              </div>
              <div>
                • <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> Clear
                input
              </div>
            </div>
          </div>

          {/* Clear All Data */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              🗑️ Data Management
            </label>
            <div className="space-y-2">
              <button
                onClick={onClearAllData}
                disabled={isClearingData}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                {isClearingData ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Clearing Data...
                  </>
                ) : (
                  "Clear All Data"
                )}
              </button>
              <div className="text-xs text-gray-500">
                This will permanently delete all your chats, messages, and
                documents. Your authentication will remain intact.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
