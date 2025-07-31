"use client";

import { useState, useRef, useEffect } from "react";
import {
  api,
  DocumentResponse,
  QueryResponse,
  ChatSessionResponse,
  MessageResponse,
} from "../lib/api";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{ filename: string; relevance: string }>;
  metadata?: {
    searchMethod?: string;
    aiMethod?: string;
    fallbackUsed?: boolean;
    documentsFound?: number;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function Home() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your AI assistant. I can help you with questions about your uploaded documents. You can upload PDF, DOCX, DOC, TXT, MD, and RTF files and ask me anything about their content.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [documentsCount, setDocumentsCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions from database on mount
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        const response = await fetch("/api/chat");
        if (response.ok) {
          const data = await response.json();
          if (data.sessions && data.sessions.length > 0) {
            const sessions = data.sessions.map(
              (session: ChatSessionResponse) => ({
                id: session.session_id,
                title: session.title,
                messages: [],
                createdAt: new Date(session.created_at),
                updatedAt: new Date(session.updated_at || session.created_at),
              })
            );
            setChatSessions(sessions);
            setCurrentChatId(sessions[0].id);
            // Load messages for the first session
            await loadMessages(sessions[0].id);
          } else {
            // No existing sessions, create a new one
            await createNewChat();
          }
        } else {
          // Error loading sessions, create a new one
          await createNewChat();
        }
      } catch (error) {
        console.error("Error loading chat sessions:", error);
        // If there's an error, create a new chat
        await createNewChat();
      }
    };

    loadChatSessions();
    fetchDocumentsCount();
  }, []);

  const loadMessages = async (sessionId: string) => {
    try {
      const messages = await api.getMessages(sessionId);
      const formattedMessages = messages.map((msg: MessageResponse) => ({
        id: msg.message_id,
        type: msg.type as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        sources: msg.sources || [],
        metadata: msg.metadata || {},
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const createNewChat = async () => {
    const newChatId = Date.now().toString();
    const newChat: ChatSession = {
      id: newChatId,
      title: "New Chat",
      messages: [
        {
          id: "1",
          type: "assistant",
          content:
            "Hello! I'm your AI assistant. I can help you with questions about your uploaded documents. You can upload PDF, DOCX, DOC, TXT, MD, and RTF files and ask me anything about their content.",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Save to database
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: newChatId, title: "New Chat" }),
      });

      // Save initial message
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: newChatId,
          messageId: "1",
          type: "assistant",
          content:
            "Hello! I'm your AI assistant. I can help you with questions about your uploaded documents. You can upload PDF, DOCX, DOC, TXT, MD, and RTF files and ask me anything about their content.",
        }),
      });

      setChatSessions((prev) => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setMessages(newChat.messages);
      setInputValue("");
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const switchChat = async (chatId: string) => {
    const chat = chatSessions.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      await loadMessages(chatId);
      setInputValue("");
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chat?sessionId=${chatId}`, {
        method: "DELETE",
      });

      const updatedSessions = chatSessions.filter((c) => c.id !== chatId);
      setChatSessions(updatedSessions);

      if (currentChatId === chatId && updatedSessions.length > 0) {
        setCurrentChatId(updatedSessions[0].id);
        await loadMessages(updatedSessions[0].id);
      } else if (updatedSessions.length === 0) {
        await createNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: chatId, title }),
      });

      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
        )
      );
    } catch (error) {
      console.error("Error updating chat title:", error);
    }
  };

  const updateCurrentChat = async (newMessages: Message[]) => {
    setMessages(newMessages);
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: newMessages, updatedAt: new Date() }
          : chat
      )
    );
  };

  const fetchDocumentsCount = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocumentsCount(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching documents count:", error);
    }
  };

  const deleteAllDocuments = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL documents, messages, and chat sessions? This action cannot be undone and will clear everything from the database."
      )
    ) {
      return;
    }

    setIsDeletingDocuments(true);
    try {
      // Use the new clear-all endpoint
      const response = await fetch("/api/clear-all", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();

        // Clear local state
        setDocumentsCount(0);
        setChatSessions([]);
        setMessages([
          {
            id: "1",
            type: "assistant",
            content:
              "Hello! I'm your AI assistant. I can help you with questions about your uploaded documents. You can upload PDF, DOCX, DOC, TXT, MD, and RTF files and ask me anything about their content.",
            timestamp: new Date(),
          },
        ]);
        setCurrentChatId("");

        // Show success message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "assistant",
            content: `✅ Successfully cleared all data from the database. Deleted ${result.deletedDocuments} documents and ${result.deletedChats} chat sessions.`,
            timestamp: new Date(),
          },
        ]);

        // Create a new chat session
        await createNewChat();
      } else {
        throw new Error("Failed to clear all data");
      }
    } catch (error) {
      console.error("Error clearing all data:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: "❌ Error clearing all data. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsDeletingDocuments(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage("📤 Uploading document...");

    try {
      const result = await api.uploadDocument(file);

      setUploadMessage(
        `✅ Document uploaded successfully! (${(file.size / 1024).toFixed(
          1
        )} KB)`
      );
      fetchDocumentsCount();

      // Add system message about upload
      const uploadMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: `📄 Document "${file.name}" uploaded successfully! I can now answer questions about its content.`,
        timestamp: new Date(),
        metadata: {
          searchMethod: result.vector_storage_method,
          aiMethod: result.extraction_method,
          fallbackUsed: false,
        },
      };

      const newMessages = [...messages, uploadMessage];
      updateCurrentChat(newMessages);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage(
        `❌ Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    // Save user message to backend
    try {
      await api.createMessage(currentChatId, "user", inputValue);
    } catch (error) {
      console.error("Failed to save user message:", error);
    }

    const newMessages = [...messages, userMessage];
    updateCurrentChat(newMessages);
    setInputValue("");
    setIsLoading(true);

    // Update chat title based on first user message
    if (messages.length === 1) {
      const title =
        inputValue.length > 30
          ? inputValue.substring(0, 30) + "..."
          : inputValue;
      updateChatTitle(currentChatId, title);
    }

    try {
      const result = await api.queryDocuments(inputValue, currentChatId);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: result.answer,
        timestamp: new Date(),
        sources: result.sources,
        metadata: {
          searchMethod: result.search_method,
          aiMethod: result.ai_method,
          fallbackUsed: result.fallback_used,
          documentsFound: result.documents_found,
        },
      };

      // Save assistant message to backend
      try {
        await api.createMessage(
          currentChatId,
          "assistant",
          result.answer,
          result.sources,
          {
            searchMethod: result.search_method,
            aiMethod: result.ai_method,
            fallbackUsed: result.fallback_used,
            documentsFound: result.documents_found,
          }
        );
      } catch (error) {
        console.error("Failed to save assistant message:", error);
      }

      const updatedMessages = [...newMessages, assistantMessage];
      updateCurrentChat(updatedMessages);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };

      // Save error message to backend
      try {
        await api.createMessage(
          currentChatId,
          "assistant",
          errorMessage.content
        );
      } catch (saveError) {
        console.error("Failed to save error message:", saveError);
      }

      const updatedMessages = [...newMessages, errorMessage];
      updateCurrentChat(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    // Use a consistent format that doesn't depend on locale
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg py-2 px-4 hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium flex items-center justify-center cursor-pointer"
          >
            <span className="mr-2">+</span>
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 dark-scrollbar">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              className={`group relative p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                currentChatId === chat.id
                  ? "bg-gray-700 border border-gray-600"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => switchChat(chat.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-100 truncate">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(chat.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center">
            {documentsCount} document{documentsCount !== 1 ? "s" : ""} loaded
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-100">
                Document Assistant
              </h1>
              <p className="text-sm text-gray-400">
                {chatSessions.find((c) => c.id === currentChatId)?.title ||
                  "New Chat"}
              </p>
            </div>
          </div>

          {/* Upload and Delete Buttons */}
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.rtf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium cursor-pointer"
              title="Supported formats: PDF, DOCX, DOC, TXT, MD, RTF"
            >
              📄 Upload Document
            </button>
            <button
              onClick={deleteAllDocuments}
              disabled={isDeletingDocuments}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium cursor-pointer"
              title="Delete all documents, messages, and chat sessions from database"
            >
              {isDeletingDocuments ? "🗑️ Clearing..." : "🗑️ Clear All Data"}
            </button>
          </div>
        </div>

        {/* Upload Status */}
        {uploadMessage && (
          <div className="bg-blue-900/50 border-b border-blue-700 px-4 py-2">
            <p className="text-sm text-blue-200">{uploadMessage}</p>
          </div>
        )}

        {/* File Format Info */}
        {!uploadMessage && (
          <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-2">
            <p className="text-xs text-gray-400 text-center">
              Supported formats: PDF, DOCX, DOC, TXT, MD, RTF (max 10MB)
            </p>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 dark-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 border border-gray-700 text-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-400 mb-2">📚 Sources:</p>
                    <div className="space-y-1">
                      {message.sources.map((source, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-300">
                            {source.filename}
                          </span>
                          <span className="text-gray-500">
                            {Math.round(parseFloat(source.relevance) * 100)}%
                            relevant
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      {message.metadata.searchMethod && (
                        <span>🔍 {message.metadata.searchMethod}</span>
                      )}
                      {message.metadata.aiMethod && (
                        <span>🤖 {message.metadata.aiMethod}</span>
                      )}
                      {message.metadata.fallbackUsed && (
                        <span className="text-orange-400">
                          ⚠️ Fallback used
                        </span>
                      )}
                      {message.metadata.documentsFound && (
                        <span>📄 {message.metadata.documentsFound} docs</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs opacity-70 mt-2">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1 relative flex items-center">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your documents..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                rows={1}
                style={{ minHeight: "44px", maxHeight: "120px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
            >
              {isLoading ? "⏳" : "➤"}
            </button>
          </form>

          <div className="mt-2 text-xs text-gray-400 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
