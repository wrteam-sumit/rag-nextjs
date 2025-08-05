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
- **Backend**: FastAPI (Python) with Poetry dependency management
- **Database**: PostgreSQL (documents and chat sessions)
- **Vector Database**: Qdrant (semantic search)
- **AI**: Google Gemini API (embeddings and chat)
- **File Processing**: Advanced PDF processing with multiple extraction methods

## Prerequisites

- Node.js 18+
- Python 3.9+ (for backend)
- Poetry (for Python dependency management)
- PostgreSQL 12+
- Qdrant (optional, for vector search)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd rag-nextjs
npm run install:all
```

### 2. Backend Setup (Python/FastAPI)

The backend uses Poetry for dependency management. Set it up with:

```bash
# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to your PATH (add to your shell profile)
export PATH="/Users/payalpatel/.local/bin:$PATH"

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

### 3. Environment Setup

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

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

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

### 5. Start Development Server

```bash
# Start the frontend (Next.js)
npm run dev:frontend

# Start the backend (FastAPI) in a separate terminal
npm run dev:backend             # Full application
# OR
npm run dev:backend-simple      # Simple version

# Or use the convenience scripts directly
./run-backend.sh start          # Full application
./run-backend.sh start-simple   # Simple version
```

Open [http://localhost:3000](http://localhost:3000) in your browser for the frontend.
The backend API will be available at [http://localhost:8000](http://localhost:8000).

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

## Project Structure

```
rag-nextjs/
├── package.json              # Monorepo workspace manager
├── README.md                 # Project documentation
├── .gitignore               # Git ignore rules
├── env.example              # Environment variables template
├── run-backend.sh           # Backend convenience script
├── SETUP_PYTHON_BACKEND.md  # Python backend setup guide
├── doc-before-all-chats.txt # Documentation file
├── scripts/
│   └── setup-db.js          # Database setup script
├── frontend/                # Next.js frontend application
│   ├── package.json         # Frontend dependencies
│   ├── package-lock.json    # Lock file
│   ├── bun.lockb           # Bun lock file (alternative)
│   ├── tsconfig.json       # TypeScript configuration
│   ├── next.config.ts      # Next.js configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   ├── eslint.config.mjs   # ESLint configuration
│   ├── postcss.config.mjs  # PostCSS configuration
│   ├── next-env.d.ts       # Next.js types
│   ├── public/             # Static assets
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   └── src/
│       ├── app/            # Next.js App Router
│       │   ├── page.tsx    # Main application (1081 lines!)
│       │   ├── layout.tsx  # Root layout
│       │   ├── globals.css # Global styles
│       │   ├── favicon.ico # Favicon
│       │   └── api/        # API routes
│       │       ├── chat/route.ts
│       │       ├── clear-all/route.ts
│       │       ├── documents/route.ts
│       │       ├── messages/route.ts
│       │       ├── query/route.ts
│       │       ├── upload/route.ts
│       │       └── test/   # Empty directory
│       ├── lib/            # Utility libraries
│       │   ├── api.ts      # API client functions
│       │   ├── config.ts   # Configuration
│       │   ├── database.ts # Database utilities
│       │   └── qdrant.ts   # Qdrant vector DB client
│       └── types/          # TypeScript types (empty)
└── backend/                # FastAPI Python backend
    ├── pyproject.toml      # Poetry project configuration
    ├── poetry.lock         # Poetry lock file
    ├── README.md           # Backend documentation
    ├── .gitignore          # Backend git ignore
    ├── setup-poetry.sh     # Poetry setup script
    ├── run.py              # Main entry point
    ├── run_simple.py       # Simple version entry point
    ├── venv/               # Python virtual environment
    └── app/
        ├── main.py         # FastAPI main application
        ├── main_simple.py  # Simple FastAPI app
        ├── api/
        │   └── routes/     # API endpoints
        │       ├── chat.py
        │       ├── documents.py
        │       ├── messages.py
        │       └── query.py
        ├── services/       # Business logic
        │   ├── ai_service.py
        │   ├── document_processor.py
        │   ├── pdf_processor.py
        │   └── vector_service.py
        ├── models/         # Data models
        │   ├── __init__.py
        │   └── document.py
        ├── core/           # Core configuration
        │   ├── config.py
        │   └── database.py
        └── utils/          # Utility functions (empty)
```

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

### Available Scripts

**Root (Monorepo):**

```bash
npm run dev              # Start frontend (default)
npm run dev:frontend     # Start Next.js development server
npm run dev:backend      # Start FastAPI backend
npm run dev:backend-simple # Start simple backend
npm run install:all      # Install all dependencies
npm run install:frontend # Install frontend dependencies
npm run install:backend  # Install backend dependencies
npm run build:frontend   # Build frontend for production
npm run start:frontend   # Start frontend production server
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

## Project Statistics

- **Frontend**: 1 main page (1081 lines!), 6 API routes
- **Backend**: 4 API routes, 4 services, 2 models
- **Total Files**: ~50+ files across the project
- **Tech Stack**: Next.js 15, React 19, FastAPI, PostgreSQL, Qdrant, Google Gemini

## Missing/Empty Directories

The following directories are currently empty and may need attention:

1. **`frontend/src/types/`** - Empty (needs TypeScript interfaces)
2. **`frontend/src/components/`** - Missing (for reusable UI components)
3. **`frontend/src/utils/`** - Missing (for utility functions)
4. **`backend/app/utils/`** - Empty
5. **`frontend/src/app/api/test/`** - Empty

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

5. **Port Conflicts**
   - Frontend may use port 3001 if 3000 is occupied
   - Check console output for actual port number

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
