# PDF RAG Assistant

A modern Next.js 15 application that allows you to upload PDF documents and ask questions using AI-powered Retrieval Augmented Generation (RAG).

## 🚀 Features

- **PDF Upload**: Upload PDF documents to ChromaDB vector database
- **AI Q&A**: Ask questions about your uploaded documents
- **Modern UI**: Clean, responsive design with dark mode support
- **Real-time Processing**: Instant answers using OpenAI's GPT models
- **Vector Search**: Semantic search using embeddings

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Get Free OpenAI API Key

1. **Sign up for free**: Go to [OpenAI Platform](https://platform.openai.com/)
2. **Get $5 free credits**: New accounts get $5 in free API credits
3. **Create API key**:
   - Go to [API Keys page](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Create the environment file
touch .env.local
```

Add your OpenAI API key to `.env.local`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_api_key_here

# Optional: ChromaDB Configuration
# CHROMA_HOST=localhost
# CHROMA_PORT=8000
```

### 4. Start Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 How to Use

1. **Upload PDF**: Click "Choose File" and select a PDF document
2. **Process**: Click "Upload to ChromaDB" to process and store the document
3. **Ask Questions**: Type your question in the text area
4. **Get Answers**: Click "Ask Question" to receive AI-powered answers

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI GPT-4o-mini, text-embedding-3-small
- **Vector Database**: ChromaDB
- **PDF Processing**: pdf-parse
- **File Upload**: Multer

## 🔧 API Endpoints

- `POST /api/upload` - Upload and process PDF files
- `POST /api/query` - Ask questions about uploaded documents

## 💡 Tips

- **Free Credits**: The $5 free OpenAI credits can handle thousands of queries
- **PDF Size**: Larger PDFs may take longer to process
- **Question Quality**: Be specific in your questions for better answers
- **Multiple Documents**: You can upload multiple PDFs for comprehensive answers

## 🚀 Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `OPENAI_API_KEY` to Vercel environment variables
4. Deploy!

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
