# 🐍 Python Backend Setup Guide

This guide will help you set up the Python backend for better PDF processing and RAG functionality.

## 🎯 Why Python Backend?

The Python backend provides:

- **Better PDF Processing**: Multiple extraction methods including OCR
- **Advanced Libraries**: pdfplumber, PyMuPDF, Tesseract OCR
- **Robust AI Integration**: Better error handling and fallbacks
- **Scalable Architecture**: FastAPI with async support

## 📋 Prerequisites

1. **Python 3.8+** installed
2. **PostgreSQL** running (already set up)
3. **Google API Key** (already configured)
4. **Tesseract OCR** (for image-based PDFs)

## 🛠️ Installation Steps

### 1. Install Tesseract OCR

```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

### 2. Set up Python Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

Your `.env` file should contain:

```env
# Database (same as current setup)
POSTGRES_USER=payalpatel
POSTGRES_HOST=localhost
POSTGRES_DB=rag_database
POSTGRES_PASSWORD=
POSTGRES_PORT=5432

# Google AI (same as current)
GOOGLE_API_KEY=your_google_api_key

# Qdrant (optional)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

### 4. Run the Backend

```bash
# Start the Python backend
python run.py
```

The backend will run on `http://localhost:8000`

## 🔄 Switch Frontend to Python Backend

### Option 1: Environment Variable

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Option 2: Direct Configuration

Edit `src/lib/config.ts`:

```typescript
API_BASE_URL: 'http://localhost:8000',
```

## 🚀 Test the Setup

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

### 2. Upload Your PDF

Use the web interface or test with curl:

```bash
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@120tph\ Crushing\ Plant.pdf"
```

### 3. Query Documents

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the capacity of the crushing plant?"}'
```

## 📊 Expected Improvements

With the Python backend, you should see:

1. **Better PDF Text Extraction**:

   - Handles complex PDFs
   - OCR for image-based PDFs
   - Multiple fallback methods

2. **More Detailed Responses**:

   - Better context understanding
   - More accurate answers
   - Proper source citations

3. **Robust Error Handling**:
   - Graceful fallbacks
   - Better error messages
   - Multiple extraction methods

## 🔧 Troubleshooting

### PDF Processing Issues

1. **Install Tesseract**: Required for OCR
2. **Check File Permissions**: Ensure temp directory is writable
3. **Verify PDF Format**: Some PDFs may be corrupted

### Database Issues

1. **Check PostgreSQL**: Ensure it's running
2. **Verify Connection**: Check credentials in `.env`
3. **Create Tables**: Tables are auto-created on startup

### AI Service Issues

1. **Check API Key**: Verify Google API key is valid
2. **Rate Limits**: Monitor API usage
3. **Network**: Ensure internet connection

## 📖 API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

## 🎯 Next Steps

1. **Test with your PDF**: Upload and query your document
2. **Compare Results**: Notice the improvement in text extraction
3. **Explore Features**: Try different question types
4. **Monitor Performance**: Check logs for any issues

## 🔄 Migration from Current Setup

The Python backend uses the same:

- **Database**: PostgreSQL with same schema
- **AI Service**: Google Gemini API
- **Vector Database**: Qdrant (optional)

So your existing data will work seamlessly!
