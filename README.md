# RAG Next.js Application

A modern Retrieval-Augmented Generation (RAG) application built with Next.js frontend and FastAPI backend, featuring multi-agent capabilities, document processing, and web search integration.

## 🚀 Features

- **Multi-Agent System**: Domain-specific AI agents for different types of queries
- **Document Processing**: Support for PDF, DOCX, DOC, TXT, MD, and RTF files
- **Web Search Integration**: Real-time web search capabilities
- **Hybrid Mode**: Combine document knowledge with web search
- **User Authentication**: Secure user management system
- **Real-time Chat**: Interactive chat interface with message history
- **Document Management**: Upload, process, and manage documents
- **Export Functionality**: Export chat sessions and documents

## 📁 Project Structure

```
rag-nextjs/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   ├── lib/            # Utility libraries
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic services
│   ├── pyproject.toml      # Python dependencies
│   └── README.md           # Backend documentation
├── scripts/                 # Utility scripts
│   └── setup-db.js         # Database setup script
├── docs/                   # Documentation
├── run-backend.sh          # Backend management script
└── package.json            # Monorepo configuration
```

## 🛠️ Technology Stack

### Frontend

- **Next.js 15**: React framework with app router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Hot Toast**: Toast notifications
- **React Icons**: Icon library

### Backend

- **FastAPI**: Modern Python web framework
- **Poetry**: Python dependency management
- **SQLAlchemy**: Database ORM
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### AI & Search

- **Google Generative AI**: Large language models
- **Qdrant**: Vector database
- **Web Search**: Real-time web search integration

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **npm**
- **Python 3.8+** and **Poetry**
- **PostgreSQL** database
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rag-nextjs
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install separately:
npm run install:frontend  # Frontend only
npm run install:backend   # Backend only
```

### 3. Setup Database

```bash
# Setup PostgreSQL database
npm run db:setup
```

### 4. Configure Environment

Create environment files:

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend (.env):**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rag_database
GOOGLE_API_KEY=your_google_api_key
SECRET_KEY=your_secret_key
```

### 5. Start Development Servers

```bash
# Start frontend (Next.js)
npm run dev:frontend

# Start backend (FastAPI) - in a new terminal
npm run dev:backend

# Or start both together
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📚 Available Scripts

### Root Level Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Installation
npm run install:all      # Install all dependencies
npm run install:frontend # Install frontend dependencies
npm run install:backend  # Install backend dependencies

# Database
npm run db:setup         # Setup database tables

# Backend Management
npm run backend:add      # Add Python dependency
npm run backend:add-dev  # Add development dependency
npm run backend:remove   # Remove dependency
npm run backend:update   # Update dependencies
npm run backend:show     # Show dependencies
npm run backend:shell    # Open Poetry shell

# Build & Deploy
npm run build           # Build frontend
npm run start           # Start production frontend
npm run clean           # Clean build artifacts
```

### Backend Management Script

```bash
# Install backend dependencies
./run-backend.sh install

# Start backend server
./run-backend.sh start

# Start simple backend server
./run-backend.sh start-simple

# Add dependency
./run-backend.sh add requests

# Add development dependency
./run-backend.sh add-dev pytest

# Remove dependency
./run-backend.sh remove requests

# Update dependencies
./run-backend.sh update

# Show dependencies
./run-backend.sh show

# Open Poetry shell
./run-backend.sh shell

# Show help
./run-backend.sh help
```

## 🔧 Configuration

### Frontend Configuration

The frontend configuration is in `frontend/src/lib/config.ts`:

```typescript
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // ... other config options
};
```

### Backend Configuration

The backend configuration is in `backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@localhost:5432/rag_database"
    google_api_key: str
    secret_key: str
    # ... other settings
```

## 📖 Documentation

- [Backend Setup](./docs/SETUP_PYTHON_BACKEND.md)
- [User Authentication](./docs/USER_AUTHENTICATION_SETUP.md)
- [Multi-Agent Setup](./docs/MULTI_AGENT_SETUP.md)
- [Chat Session Notes](./docs/CHAT_SESSION_NOTES.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [documentation](./docs/)
2. Search existing [issues](../../issues)
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- FastAPI team for the modern Python web framework
- Google AI for the generative AI capabilities
- All contributors and users of this project
