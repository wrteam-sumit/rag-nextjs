from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG API",
    description="Retrieval-Augmented Generation API with advanced PDF processing",
    version="1.0.0"
)

# CORS middleware - allow both localhost and Vercel frontend
origins = [
    "http://localhost:3000",
    "https://rag-nextjs-frontend.vercel.app",
    "https://rag-nextjs.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "RAG API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is operational"}

@app.get("/test")
async def test():
    return {"message": "Python backend is working!", "timestamp": "2025-08-14"}

@app.get("/api/test")
async def api_test():
    return {"message": "API endpoints are accessible", "version": "1.0.0"}

# Note: Database tables will be created when first accessed
# from app.core.database import engine, Base
# Base.metadata.create_all(bind=engine)

def main():
    """Main function to run the simple FastAPI application with uvicorn"""
    import uvicorn
    logger.info("Starting RAG API server...")
    uvicorn.run(
        "app.main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main() 