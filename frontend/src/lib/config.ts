// Configuration for the application
export const config = {
  // Backend API URL - Python backend (used by Next.js API routes)
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: [".pdf", ".docx", ".txt", ".rtf"],

  // Chat settings
  DEFAULT_CHAT_SESSION: "default",

  // UI settings
  MAX_MESSAGE_LENGTH: 1000,
  DEBOUNCE_DELAY: 300,
};

// API endpoints - Frontend calls Next.js API routes
export const API_ENDPOINTS = {
  // Documents
  UPLOAD_DOCUMENT: `/api/upload`,
  GET_DOCUMENTS: `/api/documents`,
  DELETE_DOCUMENT: (id: string) => `/api/documents/${id}`,

  // Query
  QUERY_DOCUMENTS: `/api/query`,
  GET_DOMAINS: `/api/query/domains`,

  // Chat
  GET_CHAT_SESSIONS: `/api/chat`,
  CREATE_CHAT_SESSION: `/api/chat`,
  DELETE_CHAT_SESSION: (id: string) => `/api/chat/${id}`,

  // Messages
  GET_MESSAGES: (sessionId: string) => `/api/messages?session_id=${sessionId}`,
  CREATE_MESSAGE: `/api/messages`,
  SAVE_MESSAGE: `/api/messages`,
  DELETE_MESSAGE: (messageId: string) => `/api/messages/${messageId}`,
  DELETE_SESSION_MESSAGES: (sessionId: string) =>
    `/api/messages/session/${sessionId}`,
  CLEAR_ALL_MESSAGES: `/api/clear-all`,
};
