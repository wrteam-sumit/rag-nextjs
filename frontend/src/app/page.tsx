"use client";

import { useState, useRef, useEffect } from "react";
import {
  api,
  DocumentResponse,
  ChatSessionResponse,
  MessageResponse,
} from "../lib/api";
import SettingsPanel from "../components/SettingsPanel";

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
    domain?: string;
    domainName?: string;
    domainDescription?: string;
    webSearchUsed?: boolean;
    modelUsed?: string;
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
        "Hello! I’m your AI assistant. Ask me anything. In Web mode I’ll search the web. In Document mode, upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask about them. In Hybrid mode I use your documents first, then the web if needed.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [documentsCount, setDocumentsCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-agent system state
  const [selectedDomain, setSelectedDomain] = useState("general");
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availableDomains, setAvailableDomains] = useState<
    Array<{ id: string; name: string; description: string }>
  >([]);
  const [chatMode, setChatMode] = useState("hybrid"); // "document", "web", "hybrid"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set client flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load available domains
  const loadAvailableDomains = async () => {
    try {
      const domainsResponse = await api.getAvailableDomains();
      setAvailableDomains(domainsResponse.domains);
    } catch (error) {
      console.error("Failed to load domains:", error);
    }
  };

  // Load chat sessions from database
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

  // Load initial data
  useEffect(() => {
    if (isClient) {
      loadChatSessions();
      fetchDocumentsCount();
      loadAvailableDomains();
    }
  }, [isClient]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New chat
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createNewChat();
      }

      // Ctrl/Cmd + K: Focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const textarea = document.querySelector(
          "textarea"
        ) as HTMLTextAreaElement;
        textarea?.focus();
      }

      // Ctrl/Cmd + U: Upload file
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }

      // Escape: Clear input
      if (e.key === "Escape") {
        setInputValue("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
            "Hello! I’m your AI assistant. Ask me anything. In Web mode I’ll search the web. In Document mode, upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask about them. In Hybrid mode I use your documents first, then the web if needed.",
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
            "Hello! I’m your AI assistant. Ask me anything. In Web mode I’ll search the web. In Document mode, upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask about them. In Hybrid mode I use your documents first, then the web if needed.",
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
        setDocumentsCount(data.length || 0);
        setDocuments(data);
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

  const deleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc.document_id !== documentId));
        setDocumentsCount(documentsCount - 1);
        setUploadMessage("✅ Document deleted successfully!");
        setTimeout(() => setUploadMessage(""), 3000);
      } else {
        setUploadMessage("❌ Failed to delete document");
        setTimeout(() => setUploadMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setUploadMessage("❌ Error deleting document");
      setTimeout(() => setUploadMessage(""), 3000);
    }
  };

  const exportChat = () => {
    const chatTitle =
      chatSessions.find((c) => c.id === currentChatId)?.title || "Chat";
    const exportData = {
      title: chatTitle,
      timestamp: new Date().toISOString(),
      messages: messages.map((msg) => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        sources: msg.sources,
        metadata: msg.metadata,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const regenerateResponse = async () => {
    if (!lastUserMessage || isLoading) return;

    setIsLoading(true);
    setCanRegenerate(false);

    // Remove the last assistant message if it exists
    const messagesWithoutLastAssistant = messages.filter((msg, index) => {
      if (index === messages.length - 1 && msg.type === "assistant") {
        return false;
      }
      return true;
    });

    updateCurrentChat(messagesWithoutLastAssistant);

    try {
      const result = await api.queryDocuments(lastUserMessage, currentChatId);

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

      const updatedMessages = [
        ...messagesWithoutLastAssistant,
        assistantMessage,
      ];
      updateCurrentChat(updatedMessages);
      setCanRegenerate(true);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nPlease try again or check if you have uploaded any documents. You can also try:\n• Uploading a different document\n• Rephrasing your question\n• Checking your internet connection`,
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

      const updatedMessages = [...messagesWithoutLastAssistant, errorMessage];
      updateCurrentChat(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage("❌ File too large. Maximum size is 10MB.");
      setTimeout(() => setUploadMessage(""), 5000);
      return;
    }

    // Check file type
    const allowedTypes = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setUploadMessage(
        "❌ Unsupported file type. Please upload PDF, DOCX, DOC, TXT, MD, or RTF files."
      );
      setTimeout(() => setUploadMessage(""), 5000);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage("📤 Uploading document...");

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const result = await api.uploadDocument(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadMessage(
        `✅ Successfully uploaded ${result.filename} (${result.text_length} characters extracted)`
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

      setTimeout(() => {
        setUploadMessage("");
        setUploadProgress(0);
        setIsUploading(false);
      }, 3000);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setIsUploading(false);
      console.error("Upload error:", error);
      setUploadMessage(
        `❌ Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setTimeout(() => setUploadMessage(""), 5000);
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
    setCanRegenerate(false);
    setLastUserMessage(inputValue);

    // Update chat title based on first user message
    if (messages.length === 1) {
      const title =
        inputValue.length > 30
          ? inputValue.substring(0, 30) + "..."
          : inputValue;
      updateChatTitle(currentChatId, title);
    }

    try {
      // Determine web search setting based on chat mode
      let shouldUseWebSearch = false;
      if (chatMode === "web") {
        shouldUseWebSearch = true; // Always use web search in web mode
      } else if (chatMode === "hybrid") {
        shouldUseWebSearch = useWebSearch; // Use user setting in hybrid mode
      } else if (chatMode === "document") {
        shouldUseWebSearch = false; // Never use web search in document mode
      }

      const result = await api.queryDocuments(
        inputValue,
        currentChatId,
        selectedDomain === "general" ? undefined : selectedDomain,
        shouldUseWebSearch
      );

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
          domain: result.domain,
          domainName: result.domain_name,
          domainDescription: result.domain_description,
          webSearchUsed: result.web_search_used,
          modelUsed: result.model_used,
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
      setCanRegenerate(true);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nPlease try again or check if you have uploaded any documents. You can also try:\n• Uploading a different document\n• Rephrasing your question\n• Checking your internet connection`,
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
    // Use a consistent date format instead of locale-dependent toLocaleDateString
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}/${day}/${year}`;
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
              className={`group relative p-3 rounded-lg cursor-pointer mb-2 transition-all duration-200 ${
                currentChatId === chat.id
                  ? "bg-gray-700 border border-gray-600 shadow-md"
                  : "hover:bg-gray-700 hover:shadow-sm"
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

        {/* Documents Panel */}
        {showDocuments && documents.length > 0 && (
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-200">Documents</h3>
              <button
                onClick={() => setShowDocuments(false)}
                className="text-gray-400 hover:text-gray-300 text-xs cursor-pointer"
              >
                Hide
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className="bg-gray-700 rounded-lg p-3 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 font-medium truncate">
                        {doc.filename}
                      </p>
                      <p className="text-gray-400 mt-1">
                        {doc.file_type.toUpperCase()} •{" "}
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </p>
                      {doc.text_length && (
                        <p className="text-gray-500 mt-1">
                          {doc.text_length.toLocaleString()} characters
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.document_id)}
                      className="ml-2 text-red-400 hover:text-red-300 text-xs cursor-pointer"
                      title="Delete document"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="text-xs text-gray-400">
              {documentsCount} document{documentsCount !== 1 ? "s" : ""} loaded
            </div>
          </div>
          {documentsCount > 0 && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <button
                onClick={() => setShowDocuments(!showDocuments)}
                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {showDocuments ? "Hide" : "Show"} Documents
              </button>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-500">
                Ready to answer questions
              </span>
            </div>
          )}
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
                {chatMode === "web"
                  ? "Web Assistant"
                  : chatMode === "hybrid"
                  ? "Hybrid Assistant"
                  : "Document Assistant"}
              </h1>
              <p className="text-sm text-gray-400">
                {chatSessions.find((c) => c.id === currentChatId)?.title ||
                  "New Chat"}
              </p>
            </div>
          </div>

          {/* Upload and Delete Buttons */}
          <div className="flex items-center space-x-2">
            {messages.length > 1 && (
              <button
                onClick={exportChat}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium cursor-pointer"
                title="Export chat conversation"
              >
                📥
              </button>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium cursor-pointer"
              title="AI Settings - Domain selection and web search"
            >
              ⚙️
            </button>
            {chatMode !== "web" && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Upload Status */}
        {uploadMessage && (
          <div className="bg-blue-900/50 border-b border-blue-700 px-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-200">{uploadMessage}</p>
              {isUploading && uploadProgress > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-blue-700 rounded-full h-2">
                    <div
                      className="bg-blue-300 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-blue-300">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Format Info */}
        {!uploadMessage && chatMode !== "web" && (
          <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-2">
            <p className="text-xs text-gray-400 text-center">
              Supported formats: PDF, DOCX, DOC, TXT, MD, RTF (max 10MB)
            </p>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 dark-scrollbar">
          {messages.length === 1 && documentsCount === 0 && (
            <div className="flex justify-center items-center h-64">
              {chatMode === "web" ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-2xl">🌐</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">
                      Welcome to Web Assistant
                    </h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                      Ask me anything. I’ll search the web and summarize the
                      latest information for you. Use the ⚙️ Settings to select
                      a domain if needed.
                    </p>
                  </div>
                </div>
              ) : chatMode === "hybrid" ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-2xl">🔄</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">
                      Welcome to Hybrid Assistant
                    </h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                      I’ll use your documents first and fall back to web search
                      if needed. You can upload files or just start asking
                      questions.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium cursor-pointer"
                    >
                      📄 Upload Document
                    </button>
                    <span className="text-gray-500 text-sm">or</span>
                    <button
                      onClick={() => {
                        const textarea = document.querySelector(
                          "textarea"
                        ) as HTMLTextAreaElement;
                        textarea?.focus();
                      }}
                      className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium cursor-pointer"
                    >
                      ✍️ Ask a question
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-2xl">📄</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">
                      Welcome to Document Assistant
                    </h3>
                    <p className="text-gray-400 text-sm max-w-md">
                      Upload your documents (PDF, DOCX, DOC, TXT, MD, RTF) and
                      I’ll help you find answers to any questions about their
                      content.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium cursor-pointer"
                  >
                    📄 Upload Your First Document
                  </button>
                </div>
              )}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              } mb-6`}
            >
              <div
                className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-800 border border-gray-700 text-gray-100 shadow-lg"
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
                      {message.metadata.domain &&
                        message.metadata.domain !== "general" && (
                          <span title={message.metadata.domainDescription}>
                            🎯{" "}
                            {message.metadata.domainName ||
                              message.metadata.domain}
                          </span>
                        )}
                      {message.metadata.webSearchUsed && (
                        <span
                          className="text-blue-400"
                          title="Web search was used to enhance the response"
                        >
                          🌐 Web search
                        </span>
                      )}
                      {message.metadata.modelUsed && (
                        <span title={`Model: ${message.metadata.modelUsed}`}>
                          🤖{" "}
                          {message.metadata.modelUsed.includes("gemini")
                            ? "Gemini"
                            : message.metadata.modelUsed}
                        </span>
                      )}
                      {message.metadata.searchMethod && (
                        <span>🔍 {message.metadata.searchMethod}</span>
                      )}
                      {message.metadata.aiMethod && (
                        <span>⚡ {message.metadata.aiMethod}</span>
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

                {isClient && (
                  <div
                    className="text-xs opacity-70 mt-2"
                    title={message.timestamp.toISOString()}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                )}
                {!isClient && (
                  <div className="text-xs opacity-70 mt-2">
                    {/* Placeholder to maintain layout during SSR */}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
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
                placeholder={
                  chatMode === "web"
                    ? "Ask me anything - I'll search the web for you..."
                    : chatMode === "document"
                    ? documentsCount > 0
                      ? `Ask me about your ${documentsCount} document${
                          documentsCount !== 1 ? "s" : ""
                        }...`
                      : "Upload documents first, then ask me about them..."
                    : documentsCount > 0
                    ? `Ask me about your ${documentsCount} document${
                        documentsCount !== 1 ? "s" : ""
                      } or anything else...`
                    : "Ask me anything - I'll search the web for you..."
                }
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

          {/* Regenerate Button */}
          {canRegenerate && !isLoading && messages.length > 1 && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={regenerateResponse}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium cursor-pointer flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Regenerate response</span>
              </button>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400 text-center">
            Press Enter to send, Shift+Enter for new line •
            <span className="ml-1 text-gray-500">
              ⌘+N: New chat • ⌘+K: Focus input • ⌘+U: Upload file • Esc: Clear
            </span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedDomain={selectedDomain}
        onDomainChange={setSelectedDomain}
        useWebSearch={useWebSearch}
        onWebSearchChange={setUseWebSearch}
        chatMode={chatMode}
        onChatModeChange={setChatMode}
      />
    </div>
  );
}
