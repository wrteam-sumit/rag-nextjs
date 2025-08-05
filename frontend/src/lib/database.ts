import { Pool } from "pg";

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || "payalpatel",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "rag_database",
  password: process.env.POSTGRES_PASSWORD || "",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Database initialization
export async function initializeDatabase() {
  try {
    // Create documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        document_id VARCHAR(255) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size BIGINT NOT NULL,
        text_content TEXT NOT NULL,
        text_length INTEGER NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create chat_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        message_id VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'assistant')),
        content TEXT NOT NULL,
        sources JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
      CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    `);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Document operations
export async function saveDocument(documentData: {
  documentId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  textContent: string;
  textLength: number;
  metadata?: Record<string, string | number | boolean>;
}) {
  const query = `
    INSERT INTO documents (document_id, filename, file_type, file_size, text_content, text_length, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (document_id) DO UPDATE SET
      filename = EXCLUDED.filename,
      file_type = EXCLUDED.file_type,
      file_size = EXCLUDED.file_size,
      text_content = EXCLUDED.text_content,
      text_length = EXCLUDED.text_length,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;

  const values = [
    documentData.documentId,
    documentData.filename,
    documentData.fileType,
    documentData.fileSize,
    documentData.textContent,
    documentData.textLength,
    JSON.stringify(documentData.metadata || {}),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getDocument(documentId: string) {
  const query = "SELECT * FROM documents WHERE document_id = $1";
  const result = await pool.query(query, [documentId]);
  return result.rows[0];
}

export async function getAllDocuments() {
  const query = "SELECT * FROM documents ORDER BY upload_date DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function deleteDocument(documentId: string) {
  const query = "DELETE FROM documents WHERE document_id = $1 RETURNING id";
  const result = await pool.query(query, [documentId]);
  return result.rows[0];
}

// Chat session operations
export async function saveChatSession(sessionData: {
  sessionId: string;
  title: string;
}) {
  const query = `
    INSERT INTO chat_sessions (session_id, title)
    VALUES ($1, $2)
    ON CONFLICT (session_id) DO UPDATE SET
      title = EXCLUDED.title,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;

  const values = [sessionData.sessionId, sessionData.title];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getChatSession(sessionId: string) {
  const query = "SELECT * FROM chat_sessions WHERE session_id = $1";
  const result = await pool.query(query, [sessionId]);
  return result.rows[0];
}

export async function getAllChatSessions() {
  const query = "SELECT * FROM chat_sessions ORDER BY updated_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function deleteChatSession(sessionId: string) {
  const query = "DELETE FROM chat_sessions WHERE session_id = $1 RETURNING id";
  const result = await pool.query(query, [sessionId]);
  return result.rows[0];
}

// Message operations
export async function saveMessage(messageData: {
  sessionId: string;
  messageId: string;
  type: "user" | "assistant";
  content: string;
  sources?: Array<{ filename: string; relevance: string }>;
  metadata?: Record<string, string | number | boolean>;
}) {
  const query = `
    INSERT INTO messages (session_id, message_id, type, content, sources, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;
  `;

  const values = [
    messageData.sessionId,
    messageData.messageId,
    messageData.type,
    messageData.content,
    JSON.stringify(messageData.sources || []),
    JSON.stringify(messageData.metadata || {}),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getMessages(sessionId: string) {
  const query =
    "SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC";
  const result = await pool.query(query, [sessionId]);
  return result.rows;
}

export async function deleteMessages(sessionId: string) {
  const query = "DELETE FROM messages WHERE session_id = $1 RETURNING id";
  const result = await pool.query(query, [sessionId]);
  return result.rows;
}

// Close database connection
export async function closeDatabase() {
  await pool.end();
}

export { pool };
