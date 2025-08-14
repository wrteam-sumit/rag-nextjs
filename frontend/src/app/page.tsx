"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  api,
  DocumentResponse,
  ChatSessionResponse,
  MessageResponse,
} from "../lib/api";
import SettingsPanel from "../components/SettingsPanel";
import AuthWrapper from "../components/AuthWrapper";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import WelcomeMessage from "../components/WelcomeMessage";
import LoadingIndicator from "../components/LoadingIndicator";
import { Message, ChatSession } from "../types/chat";

export default function Home() {
  // State management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your AI assistant. I'm currently in Document mode - upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask me questions about them. You can also switch to Web mode to search the web, or Hybrid mode to use both documents and web search.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [documentsCount, setDocumentsCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start open by default
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-agent system state
  const [selectedAssistant, setSelectedAssistant] = useState("general");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatMode, setChatMode] = useState("document"); // "document", "web", "hybrid"

  // Utility functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effects
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadChatSessions();
      fetchDocumentsCount();
    }
  }, [isClient]);

  // Handle responsive sidebar behavior - start open by default
  useEffect(() => {
    // Start with sidebar open by default
    setSidebarOpen(true);
  }, []); // Empty dependency array - only run once on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const textarea = document.querySelector(
          "textarea"
        ) as HTMLTextAreaElement;
        textarea?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if (e.key === "Escape") {
        setInputValue("");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Data loading functions
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
          await loadMessages(sessions[0].id);
        } else {
          await createNewChat();
        }
      } else {
        await createNewChat();
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to load chat sessions. Please refresh the page.");
      }
      await createNewChat();
    }
  };

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
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to load messages. Please try again.");
      }
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
            "Hello! I'm your AI assistant. I'm currently in Document mode - upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask me questions about them. You can also switch to Web mode to search the web, or Hybrid mode to use both documents and web search.",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: newChatId, title: "New Chat" }),
      });

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: newChatId,
          type: "assistant",
          content:
            "Hello! I'm your AI assistant. I'm currently in Document mode - upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask me questions about them. You can also switch to Web mode to search the web, or Hybrid mode to use both documents and web search.",
        }),
      });

      setChatSessions((prev) => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setMessages(newChat.messages);
      setInputValue("");
    } catch (error) {
      console.error("Error creating new chat:", error);
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to create new chat. Please try again.");
      }
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
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to load documents. Please refresh the page.");
      }
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
      const response = await fetch("/api/clear-all", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
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

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "assistant",
            content: `✅ Successfully cleared all data from the database. Deleted ${result.deletedDocuments} documents and ${result.deletedChats} chat sessions.`,
            timestamp: new Date(),
          },
        ]);

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

  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL data? This will permanently delete all your chats, messages, and documents. Your authentication will remain intact. This action cannot be undone."
      )
    ) {
      return;
    }

    setIsClearingData(true);
    try {
      const response = await fetch("/api/clear-all", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();

        // Clear all local state immediately
        setDocumentsCount(0);
        setChatSessions([]);
        setCurrentChatId("");
        setDocuments([]);

        // Reset messages to initial state
        const initialMessage = {
          id: "1",
          type: "assistant" as const,
          content:
            "Hello! I'm your AI assistant. I'm currently in Document mode - upload PDF, DOCX, DOC, TXT, MD, or RTF (max 10MB) and ask me questions about them. You can also switch to Web mode to search the web, or Hybrid mode to use both documents and web search.",
          timestamp: new Date(),
        };

        setMessages([initialMessage]);

        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "assistant" as const,
            content: `✅ Successfully cleared all data. Deleted ${result.deletedDocuments} documents, ${result.deletedChats} chat sessions, and ${result.deletedMessages} messages.`,
            timestamp: new Date(),
          },
        ]);

        // Create a fresh chat session
        await createNewChat();

        // Close settings panel
        setIsSettingsOpen(false);

        // Force refresh of data from server with cache busting
        setTimeout(async () => {
          try {
            // Clear any cached data
            if ("caches" in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }

            // Force reload chat sessions and document count
            await loadChatSessions();
            await fetchDocumentsCount();

            // Additional verification - check if data is really cleared
            setTimeout(async () => {
              try {
                const verifyResponse = await fetch("/api/chat", {
                  cache: "no-store",
                  headers: { "Cache-Control": "no-cache" },
                });
                if (verifyResponse.ok) {
                  const sessions = await verifyResponse.json();
                  console.log(
                    `🔍 Verification: Found ${
                      sessions.sessions?.length || 0
                    } chat sessions after clear`
                  );
                }
              } catch (error) {
                console.error("Error verifying data clear:", error);
              }
            }, 500);
          } catch (error) {
            console.error("Error refreshing data after clear:", error);
          }
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to clear all data");
      }
    } catch (error) {
      console.error("Error clearing all data:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant" as const,
          content: "❌ Error clearing all data. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsClearingData(false);
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

      try {
        await api.saveMessage(
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
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Regeneration failed: ${errorMsg}`);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Error: ${errorMsg}\n\nPlease try again or check if you have uploaded any documents. You can also try:\n• Uploading a different document\n• Rephrasing your question\n• Checking your internet connection`,
        timestamp: new Date(),
      };

      try {
        await api.saveMessage(currentChatId, "assistant", errorMessage.content);
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

    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage("❌ File too large. Maximum size is 10MB.");
      toast.error("File too large. Maximum size is 10MB.");
      setTimeout(() => setUploadMessage(""), 5000);
      return;
    }

    const allowedTypes = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setUploadMessage(
        "❌ Unsupported file type. Please upload PDF, DOCX, DOC, TXT, MD, or RTF files."
      );
      toast.error(
        "Unsupported file type. Please upload PDF, DOCX, DOC, TXT, MD, or RTF files."
      );
      setTimeout(() => setUploadMessage(""), 5000);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage("📤 Uploading document...");

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const result = await api.uploadDocument(file, currentChatId);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadMessage(
        `✅ Successfully uploaded ${result.filename} (${result.text_length} characters extracted)`
      );

      fetchDocumentsCount();

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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setUploadMessage(`❌ Upload failed: ${errorMessage}`);
      toast.error(`Upload failed: ${errorMessage}`);
      setTimeout(() => setUploadMessage(""), 5000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    try {
      await api.saveMessage(currentChatId, "user", message);
    } catch (error) {
      console.error("Failed to save user message:", error);
    }

    const newMessages = [...messages, userMessage];
    updateCurrentChat(newMessages);

    // Clear input
    setInputValue("");
    setLastUserMessage(message);

    // Generate AI response
    setIsLoading(true);
    setCanRegenerate(false);

    try {
      let shouldUseWebSearch = false;
      if (chatMode === "web") {
        shouldUseWebSearch = true;
      } else if (chatMode === "hybrid") {
        shouldUseWebSearch = useWebSearch;
      } else if (chatMode === "document") {
        shouldUseWebSearch = false;
      }

      const result = await api.queryDocuments(
        message,
        currentChatId,
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
          assistantName: result.assistant_name,
          assistantDescription: result.assistant_description,
          webSearchUsed: result.web_search_used,
          modelUsed: result.model_used,
        },
      };

      try {
        await api.saveMessage(
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
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Query failed: ${errorMsg}`);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Error: ${errorMsg}\n\nPlease try again or check if you have uploaded any documents. You can also try:\n• Uploading a different document\n• Rephrasing your question\n• Checking your internet connection`,
        timestamp: new Date(),
      };

      try {
        await api.saveMessage(currentChatId, "assistant", errorMessage.content);
      } catch (saveError) {
        console.error("Failed to save error message:", saveError);
      }

      const updatedMessages = [...newMessages, errorMessage];
      updateCurrentChat(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const currentChatTitle =
    chatSessions.find((c) => c.id === currentChatId)?.title || "New Chat";

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-gray-900 overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          chatSessions={chatSessions}
          currentChatId={currentChatId}
          onCreateNewChat={createNewChat}
          onSwitchChat={switchChat}
          onDeleteChat={deleteChat}
          onCloseSidebar={() => setSidebarOpen(false)}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <ChatHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            chatMode={chatMode}
            currentChatTitle={currentChatTitle}
            onExportChat={exportChat}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUploadFile={() => fileInputRef.current?.click()}
            onDeleteAllDocuments={deleteAllDocuments}
            isDeletingDocuments={isDeletingDocuments}
            messagesLength={messages.length}
          />

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
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 dark-scrollbar min-h-0">
            {/* {messages.length === 1 && documentsCount === 0 && (
              <WelcomeMessage chatMode={chatMode} />
            )} */}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRegenerate={regenerateResponse}
                canRegenerate={
                  canRegenerate &&
                  message.type === "assistant" &&
                  message.id === messages[messages.length - 1]?.id
                }
              />
            ))}

            {isLoading && <LoadingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={false}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,.rtf"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          selectedAssistant={selectedAssistant}
          onAssistantChange={setSelectedAssistant}
          useWebSearch={useWebSearch}
          onWebSearchChange={setUseWebSearch}
          chatMode={chatMode}
          onChatModeChange={setChatMode}
          onClearAllData={clearAllData}
          isClearingData={isClearingData}
        />
      </div>
    </AuthWrapper>
  );
}
