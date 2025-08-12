from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import documents, chat, query, messages
from app.core.config import settings
from app.core.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAG API",
    description="Retrieval-Augmented Generation API with advanced PDF processing",
    version="1.0.0"
)

# CORS middleware
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(query.router, prefix="/api/query", tags=["query"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])

@app.get("/")
async def root():
    return {"message": "RAG API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def main():
    """Main function to run the FastAPI application with uvicorn"""
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main() 