# RAG Python Backend

Advanced PDF processing and RAG (Retrieval-Augmented Generation) backend built with FastAPI, Python, and advanced PDF processing libraries.

## 🚀 Features

- **Advanced PDF Processing**: Multiple extraction methods including OCR
- **Vector Search**: Qdrant integration for semantic search
- **AI Integration**: Google Gemini API for embeddings and generation
- **Database**: PostgreSQL with SQLAlchemy ORM
- **RESTful API**: FastAPI with automatic documentation

## 📋 Requirements

- Python 3.8+
- PostgreSQL
- Tesseract OCR (for image-based PDFs)
- Google API Key

## 🛠️ Installation

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Install Tesseract OCR:**

   ```bash
   # macOS
   brew install tesseract

   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr

   # Windows
   # Download from: https://github.com/UB-Mannheim/tesseract/wiki
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the backend:**
   ```bash
   python run.py
   ```

## 🔧 Configuration

Create a `.env` file with:

```env
# Database
POSTGRES_USER=payalpatel
POSTGRES_HOST=localhost
POSTGRES_DB=rag_database
POSTGRES_PASSWORD=
POSTGRES_PORT=5432

# Google AI
GOOGLE_API_KEY=your_google_api_key

# Qdrant (optional)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

## 📚 API Endpoints

- `POST /api/documents/upload` - Upload and process PDF
- `GET /api/documents/` - List all documents
- `POST /api/query/` - Query documents with RAG
- `GET /api/chat/` - Chat session management

## 🔍 PDF Processing Methods

1. **pdfplumber** - Best for text-based PDFs
2. **PyMuPDF** - Alternative text extraction
3. **OCR (Tesseract)** - For image-based PDFs
4. **Pattern Extraction** - Fallback for complex PDFs

## 🎯 Usage

The backend runs on `http://localhost:8000` and provides:

- **Better PDF Processing**: Handles complex, image-based PDFs
- **OCR Support**: Extracts text from scanned documents
- **Advanced Search**: Vector-based semantic search
- **Robust Fallbacks**: Multiple extraction and search methods

## 📖 API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.
