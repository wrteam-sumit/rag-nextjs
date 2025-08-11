# RAG Next.js Application

A modern Retrieval-Augmented Generation (RAG) application built with Next.js 15, FastAPI, PostgreSQL, Qdrant vector database, and Google Gemini AI. This application allows users to upload documents, chat with them using AI, and perform semantic search across their document collection.

## 🚀 Features

- 📄 **Multi-format Document Upload**: Support for PDF, DOCX, DOC, TXT, MD, and RTF files
- 🔍 **Advanced Vector Search**: Semantic search using Qdrant vector database with fallback options
- 🤖 **AI-Powered Chat**: Powered by Google Gemini AI with context-aware responses
- 💾 **Persistent Storage**: PostgreSQL for document and chat session storage
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode and keyboard shortcuts
- 📱 **Real-time Chat**: Multi-session chat with message history and regeneration
- 🔄 **Robust Fallback System**: Graceful degradation when services are unavailable
- ⌨️ **Keyboard Shortcuts**: Ctrl/Cmd + N (new chat), Ctrl/Cmd + K (focus input), Ctrl/Cmd + U (upload)
- 📊 **Document Management**: View, delete individual documents, and clear all documents
- 💬 **Chat Export**: Export chat conversations as JSON files

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.4.4 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **File Processing**: pdf-parse, mammoth (client-side)
- **Vector DB**: Qdrant JavaScript client
- **AI**: Google Generative AI SDK

### Backend

- **Framework**: FastAPI with Uvicorn
- **Language**: Python 3.9+
- **Dependency Management**: Poetry
- **Database**: SQLAlchemy with PostgreSQL
- **Document Processing**: PyPDF2, pdfplumber, PyMuPDF, python-docx, mammoth
- **AI**: Google Generative AI
- **Vector Database**: Qdrant client

### Infrastructure

- **Database**: PostgreSQL 12+
- **Vector Database**: Qdrant
- **AI Service**: Google Gemini API

## 📋 Prerequisites

- **Node.js** 18+
- **Python** 3.9+ (for backend)
- **Poetry** (for Python dependency management)
- **PostgreSQL** 12+
- **Qdrant** (optional, for vector search)
- **Google Gemini API Key**

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd rag-nextjs

# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Backend Setup (Python/FastAPI)

The backend uses Poetry for dependency management:

```bash
# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to your PATH (add to your shell profile)
export PATH="/Users/$USER/.local/bin:$PATH"

# Setup backend dependencies
cd backend
poetry install

# Or use the convenience script from project root
./run-backend.sh install
```

**Quick Backend Commands:**

```bash
./run-backend.sh start          # Run full application
./run-backend.sh start-simple   # Run simple version
./run-backend.sh help           # Show all commands
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Google Gemini API (Required)
GOOGLE_API_KEY=your_gemini_api_key_here

# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=rag_database
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_PORT=5432

# Qdrant Vector Database (Optional)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

#### PostgreSQL Setup

1. **Install PostgreSQL**:

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

### 5. Start Development Servers

```bash
# Start the frontend (Next.js) - Terminal 1
npm run dev:frontend

# Start the backend (FastAPI) - Terminal 2
npm run dev:backend             # Full application
# OR
npm run dev:backend-simple      # Simple version

# Or use the convenience scripts directly
./run-backend.sh start          # Full application
./run-backend.sh start-simple   # Simple version
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📖 Usage Guide

### Uploading Documents

1. Click the "📄 Upload Document" button or use `Ctrl/Cmd + U`
2. Select a supported file (PDF, DOCX, DOC, TXT, MD, RTF)
3. Wait for processing (text extraction + embedding generation)
4. Document is stored in PostgreSQL and Qdrant

### Chatting with Documents

1. Type your question in the chat input or use `Ctrl/Cmd + K` to focus
2. The system will:
   - Generate embeddings for your question
   - Search for relevant documents (Qdrant or fallback)
   - Generate AI response using Gemini
   - Display sources and metadata
   - Show search method used (vector/fallback)

### Managing Chat Sessions

- **New Chat**: `Ctrl/Cmd + N` or click "New Chat"
- **Switch Sessions**: Click on different chat sessions in sidebar
- **Delete Sessions**: Click trash icon on chat session
- **Export Chat**: Click export button to download chat as JSON

### Document Management

- **View Documents**: Click "Show Documents" to see all uploaded files
- **Delete Individual**: Click trash icon on specific document
- **Clear All**: Click "Clear All Documents" to remove everything

## 🏗️ Project Structure

```
rag-nextjs/
├── package.json                 # Monorepo workspace manager
├── README.md                    # Project documentation
├── env.example                  # Environment variables template
├── run-backend.sh              # Backend convenience script
├── SETUP_PYTHON_BACKEND.md     # Python backend setup guide
├── doc-before-all-chats.txt    # Documentation file
├── scripts/
│   └── setup-db.js             # Database setup script
├── frontend/                   # Next.js frontend application
│   ├── package.json            # Frontend dependencies
│   ├── package-lock.json       # Lock file
│   ├── bun.lockb              # Bun lock file (alternative)
│   ├── tsconfig.json          # TypeScript configuration
│   ├── next.config.ts         # Next.js configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── eslint.config.mjs      # ESLint configuration
│   ├── postcss.config.mjs     # PostCSS configuration
│   ├── next-env.d.ts          # Next.js types
│   ├── public/                # Static assets
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   └── src/
│       ├── app/               # Next.js App Router
│       │   ├── page.tsx       # Main application (1126 lines)
│       │   ├── layout.tsx     # Root layout
│       │   ├── globals.css    # Global styles
│       │   ├── favicon.ico    # Favicon
│       │   └── api/           # API routes
│       │       ├── chat/route.ts
│       │       ├── clear-all/route.ts
│       │       ├── documents/route.ts
│       │       ├── messages/route.ts
│       │       ├── query/route.ts
│       │       ├── upload/route.ts
│       │       └── test/      # Empty directory
│       ├── lib/               # Utility libraries
│       │   ├── api.ts         # API client functions
│       │   ├── config.ts      # Configuration
│       │   ├── database.ts    # Database utilities
│       │   └── qdrant.ts      # Qdrant vector DB client
│       └── types/             # TypeScript types (empty)
└── backend/                   # FastAPI Python backend
    ├── pyproject.toml         # Poetry project configuration
    ├── poetry.lock            # Poetry lock file
    ├── README.md              # Backend documentation
    ├── setup-poetry.sh        # Poetry setup script
    ├── run.py                 # Main entry point
    ├── run_simple.py          # Simple version entry point
    ├── venv/                  # Python virtual environment
    └── app/
        ├── main.py            # FastAPI main application
        ├── main_simple.py     # Simple FastAPI app
        ├── api/
        │   └── routes/        # API endpoints
        │       ├── chat.py
        │       ├── documents.py
        │       ├── messages.py
        │       └── query.py
        ├── services/          # Business logic
        │   ├── ai_service.py
        │   ├── document_processor.py
        │   ├── pdf_processor.py
        │   └── vector_service.py
        ├── models/            # Data models
        │   ├── __init__.py
        │   └── document.py
        ├── core/              # Core configuration
        │   ├── config.py
        │   └── database.py
        └── utils/             # Utility functions (empty)
```

## 🔧 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │     Qdrant      │
│                 │    │                 │    │                 │
│ • File Upload   │───▶│ • Documents     │    │ • Vector Search │
│ • Chat UI       │    │ • Chat Sessions │    │ • Embeddings    │
│ • API Routes    │    │ • Messages      │    │                 │
│ • Keyboard      │    │                 │    │                 │
│   Shortcuts     │    │                 │    │                 │
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

## 🔌 API Endpoints

### Document Management

- `POST /api/upload` - Upload and process documents
- `GET /api/documents` - List all documents
- `DELETE /api/documents/:id` - Delete specific document
- `DELETE /api/clear-all` - Delete all documents

### Chat Management

- `GET /api/chat` - Get all chat sessions
- `POST /api/chat` - Create/update chat session
- `DELETE /api/chat?sessionId=:id` - Delete chat session

### Messages

- `GET /api/messages?sessionId=:id` - Get messages for session
- `POST /api/messages` - Save message

### Query

- `POST /api/query` - Ask questions about documents

## 📄 Supported File Formats

| Format   | Extension | Parser    | Status | Features                    |
| -------- | --------- | --------- | ------ | --------------------------- |
| PDF      | .pdf      | pdf-parse | ✅     | Text extraction, metadata   |
| Word     | .docx     | mammoth   | ✅     | Text extraction, formatting |
| Word     | .doc      | mammoth   | ✅     | Text extraction, formatting |
| Text     | .txt      | utf-8     | ✅     | Direct text processing      |
| Markdown | .md       | utf-8     | ✅     | Direct text processing      |
| RTF      | .rtf      | utf-8     | ✅     | Direct text processing      |

## 🛡️ Error Handling & Fallbacks

The application includes comprehensive error handling:

- **Database Failures**: Graceful fallback to in-memory storage
- **Vector Search Failures**: Fallback to keyword-based search
- **AI Service Failures**: Fallback responses with document listings
- **File Processing Errors**: Detailed error messages with suggestions
- **Network Issues**: Retry mechanisms and offline indicators

## ⌨️ Keyboard Shortcuts

| Shortcut        | Action            |
| --------------- | ----------------- |
| `Ctrl/Cmd + N`  | Create new chat   |
| `Ctrl/Cmd + K`  | Focus chat input  |
| `Ctrl/Cmd + U`  | Upload file       |
| `Escape`        | Clear input       |
| `Enter`         | Send message      |
| `Shift + Enter` | New line in input |

## 🚀 Development

### Available Scripts

**Root (Monorepo):**

```bash
npm run dev              # Start frontend (default)
npm run dev:frontend     # Start Next.js development server
npm run dev:backend      # Start FastAPI backend
npm run dev:backend-simple # Start simple backend
npm run build            # Build frontend for production
npm run start            # Start frontend production server
npm run install:all      # Install all dependencies
npm run install:frontend # Install frontend dependencies
npm run install:backend  # Install backend dependencies
npm run db:setup         # Setup database
npm run clean            # Clean all build artifacts
npm run setup            # Complete project setup
npm run test:frontend    # Run frontend linting
```

**Backend (FastAPI):**

```bash
./run-backend.sh start          # Run full application
./run-backend.sh start-simple   # Run simple version
./run-backend.sh install        # Install dependencies
./run-backend.sh shell          # Activate Poetry shell
./run-backend.sh add <pkg>      # Add dependency
./run-backend.sh add-dev <pkg>  # Add dev dependency
./run-backend.sh remove <pkg>   # Remove dependency
./run-backend.sh update         # Update dependencies
./run-backend.sh show           # Show installed packages
./run-backend.sh help           # Show all commands
```

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
| `NEXTAUTH_SECRET`   | NextAuth secret       | No       | -                     |
| `NEXTAUTH_URL`      | NextAuth URL          | No       | http://localhost:3000 |

## 📊 Project Statistics

- **Frontend**: 1 main page (1126 lines), 6 API routes
- **Backend**: 4 API routes, 4 services, 2 models, 2 core modules
- **Total Files**: ~50+ files across the project
- **Tech Stack**: Next.js 15.4.4, React 19.1.0, FastAPI, PostgreSQL, Qdrant, Google Gemini
- **Dependencies**: 15+ frontend packages, 20+ backend packages
- **Lines of Code**: ~2000+ lines across frontend and backend

## 🔍 Missing/Empty Directories

The following directories are currently empty and may need attention for future development:

1. **`frontend/src/types/`** - Empty (needs TypeScript interfaces)
2. **`frontend/src/components/`** - Missing (for reusable UI components)
3. **`frontend/src/utils/`** - Missing (for utility functions)
4. **`backend/app/utils/`** - Empty (for backend utility functions)
5. **`frontend/src/app/api/test/`** - Empty (for API testing endpoints)

**Note**: These empty directories don't affect the current functionality but could be useful for future enhancements and better code organization.

## 🐛 Troubleshooting

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

5. **Port Conflicts**
   - Frontend may use port 3001 if 3000 is occupied
   - Check console output for actual port number

### Logs

Check the console for detailed logs:

- 📤 Upload process logs
- 🔍 Search and embedding logs
- 🤖 AI response logs
- ❌ Error details with suggestions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** for the amazing React framework
- **FastAPI** for the high-performance Python web framework
- **Google Gemini** for the AI capabilities
- **Qdrant** for the vector database
- **PostgreSQL** for the reliable database
- **Tailwind CSS** for the beautiful styling
