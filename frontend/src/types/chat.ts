export interface Message {
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
    assistantName?: string;
    assistantDescription?: string;
    webSearchUsed?: boolean;
    modelUsed?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentResponse {
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  text_length?: number;
}
