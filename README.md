# RAG Next.js Application

A modern Retrieval-Augmented Generation (RAG) application built with Next.js, PostgreSQL, Qdrant vector database, and Google Gemini AI.

## Features

- 📄 **Document Upload**: Support for PDF, DOCX, DOC, TXT, MD, and RTF files
- 🔍 **Vector Search**: Semantic search using Qdrant vector database
- 🤖 **AI Chat**: Powered by Google Gemini AI
- 💾 **Persistent Storage**: PostgreSQL for document and chat storage
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode
- 📱 **Real-time Chat**: Multi-session chat with message history
- 🔄 **Fallback Support**: Graceful degradation when services are unavailable

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (documents and chat sessions)
- **Vector Database**: Qdrant (semantic search)
- **AI**: Google Gemini API (embeddings and chat)
- **File Processing**: pdf-parse, mammoth, docx-parser

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Qdrant (optional, for vector search)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd rag-nextjs
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=rag_database
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_PORT=5432

# Qdrant Vector Database (optional)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here
```

### 3. Database Setup

#### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed):

   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**:

   ```bash
   psql -U postgres
   CREATE DATABASE rag_database;
   \q
   ```

3. **Run Database Setup**:
   ```bash
   npm run db:setup
   ```

#### Qdrant Setup (Optional)

1. **Install Qdrant**:

   ```bash
   # Using Docker (recommended)
   docker run -p 6333:6333 qdrant/qdrant

   # Or download from https://qdrant.tech/documentation/guides/installation/
   ```

2. **Verify Qdrant**:
   ```bash
   curl http://localhost:6333/collections
   ```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Documents

1. Click the "📄 Upload Document" button
2. Select a supported file (PDF, DOCX, DOC, TXT, MD, RTF)
3. Wait for processing (text extraction + embedding generation)
4. Document is stored in PostgreSQL and Qdrant

### Chatting with Documents

1. Type your question in the chat input
2. The system will:
   - Generate embeddings for your question
   - Search for relevant documents (Qdrant or fallback)
   - Generate AI response using Gemini
   - Display sources and metadata

### Managing Chat Sessions

- Create new chat sessions
- Switch between sessions
- Delete old sessions
- All chat history is persisted in PostgreSQL

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │     Qdrant      │
│                 │    │                 │    │                 │
│ • File Upload   │───▶│ • Documents     │    │ • Vector Search │
│ • Chat UI       │    │ • Chat Sessions │    │ • Embeddings    │
│ • API Routes    │    │ • Messages      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Google Gemini  │    │   File Parsers  │    │   Fallback      │
│                 │    │                 │    │                 │
│ • Embeddings    │    │ • pdf-parse     │    │ • Keyword Search│
│ • Chat AI       │    │ • mammoth       │    │ • Random Vectors│
│                 │    │ • docx-parser   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Document Management

- `POST /api/upload` - Upload and process documents
- `GET /api/documents` - List all documents
- `DELETE /api/documents/:id` - Delete document

### Chat Management

- `GET /api/chat` - Get all chat sessions
- `POST /api/chat` - Create/update chat session
- `DELETE /api/chat?sessionId=:id` - Delete chat session

### Messages

- `GET /api/messages?sessionId=:id` - Get messages for session
- `POST /api/messages` - Save message

### Query

- `POST /api/query` - Ask questions about documents

## File Support

| Format   | Extension | Parser    | Status |
| -------- | --------- | --------- | ------ |
| PDF      | .pdf      | pdf-parse | ✅     |
| Word     | .docx     | mammoth   | ✅     |
| Word     | .doc      | mammoth   | ✅     |
| Text     | .txt      | utf-8     | ✅     |
| Markdown | .md       | utf-8     | ✅     |
| RTF      | .rtf      | utf-8     | ✅     |

## Error Handling

The application includes comprehensive error handling:

- **Database Failures**: Graceful fallback to in-memory storage
- **Vector Search Failures**: Fallback to keyword-based search
- **AI Service Failures**: Fallback responses with document listings
- **File Processing Errors**: Detailed error messages with suggestions

## Development

### Database Schema

```sql
-- Documents table
CREATE TABLE documents (
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

-- Chat sessions table
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
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
```

### Environment Variables

| Variable            | Description           | Required | Default               |
| ------------------- | --------------------- | -------- | --------------------- |
| `GOOGLE_API_KEY`    | Google Gemini API key | Yes      | -                     |
| `POSTGRES_USER`     | PostgreSQL username   | No       | postgres              |
| `POSTGRES_HOST`     | PostgreSQL host       | No       | localhost             |
| `POSTGRES_DB`       | PostgreSQL database   | No       | rag_database          |
| `POSTGRES_PASSWORD` | PostgreSQL password   | No       | password              |
| `POSTGRES_PORT`     | PostgreSQL port       | No       | 5432                  |
| `QDRANT_URL`        | Qdrant server URL     | No       | http://localhost:6333 |
| `QDRANT_API_KEY`    | Qdrant API key        | No       | -                     |

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check PostgreSQL is running
   - Verify connection details in `.env.local`
   - Run `npm run db:setup`

2. **Qdrant Connection Failed**

   - Check Qdrant is running on port 6333
   - Application will use fallback search

3. **Gemini API Errors**

   - Verify `GOOGLE_API_KEY` is set
   - Check API key has proper permissions
   - Application will use fallback responses

4. **File Upload Fails**
   - Check file size (max 10MB)
   - Verify file format is supported
   - Check file contains readable text

### Logs

Check the console for detailed logs:

- 📤 Upload process logs
- 🔍 Search and embedding logs
- 🤖 AI response logs
- ❌ Error details with suggestions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
