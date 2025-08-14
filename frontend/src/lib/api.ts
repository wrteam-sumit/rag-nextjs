import { API_ENDPOINTS } from "./config";

// Types for API responses
export interface DocumentResponse {
  id: number;
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  text_content?: string;
  text_length?: number;
  upload_date: string;
  extraction_method?: string;
  vector_storage_method?: string;
  success: boolean;
}

export interface QueryResponse {
  answer: string;
  sources: Array<{
    filename: string;
    relevance: string;
  }>;
  documents_found: number;
  search_method: string;
  ai_method: string;
  embedding_method: string;
  fallback_used: boolean;
  assistant_name: string;
  assistant_description: string;
  web_search_used: boolean;
  model_used: string;
}

export interface AssistantInfo {
  id: string;
  name: string;
  description: string;
}

export interface AssistantsResponse {
  assistants: AssistantInfo[];
}

export interface ChatSessionResponse {
  id: number;
  session_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface MessageResponse {
  id: number;
  message_id: string;
  session_id: string;
  type: "user" | "assistant";
  content: string;
  sources?: Array<{ filename: string; relevance: string }>;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// API Functions
export const api = {
  // Document operations
  async uploadDocument(
    file: File,
    sessionId?: string
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (sessionId) {
      formData.append("session_id", sessionId);
    }

    const response = await fetch(API_ENDPOINTS.UPLOAD_DOCUMENT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to upload document");
    }

    return response.json();
  },

  async getDocuments(): Promise<DocumentResponse[]> {
    const response = await fetch(API_ENDPOINTS.GET_DOCUMENTS);

    if (!response.ok) {
      throw new Error("Failed to fetch documents");
    }

    return response.json();
  },

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(API_ENDPOINTS.DELETE_DOCUMENT(documentId), {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete document");
    }
  },

  // Query operations with AI assistant support
  async queryDocuments(
    question: string,
    sessionId?: string,
    useWebSearch: boolean = true
  ): Promise<QueryResponse> {
    const response = await fetch(API_ENDPOINTS.QUERY_DOCUMENTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        session_id: sessionId,
        use_web_search: useWebSearch,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to query documents");
    }

    return response.json();
  },

  // Assistant operations
  async getAvailableAssistants(): Promise<AssistantsResponse> {
    const response = await fetch(API_ENDPOINTS.GET_DOMAINS); // Keep using same endpoint for now

    if (!response.ok) {
      throw new Error("Failed to fetch available assistants");
    }

    return response.json();
  },

  // Chat session operations
  async getChatSessions(): Promise<ChatSessionResponse[]> {
    const response = await fetch(API_ENDPOINTS.GET_CHAT_SESSIONS);

    if (!response.ok) {
      throw new Error("Failed to fetch chat sessions");
    }

    const data = await response.json();
    return data.sessions || [];
  },

  async createChatSession(
    sessionId: string,
    title: string
  ): Promise<ChatSessionResponse> {
    const response = await fetch(API_ENDPOINTS.CREATE_CHAT_SESSION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId, title }),
    });

    if (!response.ok) {
      throw new Error("Failed to create chat session");
    }

    const data = await response.json();
    return data.session;
  },

  async deleteChatSession(sessionId: string): Promise<void> {
    const response = await fetch(API_ENDPOINTS.DELETE_CHAT_SESSION(sessionId), {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete chat session");
    }
  },

  // Message operations
  async getMessages(sessionId?: string): Promise<MessageResponse[]> {
    const url = sessionId
      ? API_ENDPOINTS.GET_MESSAGES(sessionId)
      : API_ENDPOINTS.GET_MESSAGES("");
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = await response.json();
    return data.messages || [];
  },

  async saveMessage(
    sessionId: string,
    type: "user" | "assistant",
    content: string,
    sources?: Array<{ filename: string; relevance: string }>,
    metadata?: Record<string, unknown>
  ): Promise<MessageResponse> {
    const response = await fetch(API_ENDPOINTS.SAVE_MESSAGE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        type,
        content,
        sources,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save message");
    }

    const data = await response.json();
    return data.message;
  },

  async clearAllMessages(): Promise<void> {
    const response = await fetch(API_ENDPOINTS.CLEAR_ALL_MESSAGES, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear all messages");
    }
  },
};
