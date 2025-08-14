import os
from pydantic import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "payalpatel")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "rag_database")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    
    # Google AI
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Qdrant
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    
    # File upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # AI Models - Single model for all functionality
    EMBEDDING_MODEL: str = "embedding-001"
    GENERATION_MODEL: str = "gemini-1.5-flash"
    
    # MCP Server Configuration
    MCP_SERVER_ENABLED: bool = os.getenv("MCP_SERVER_ENABLED", "true").lower() == "true"
    MCP_SERVER_URL: str = os.getenv("MCP_SERVER_URL", "http://localhost:3001")
    MCP_SERVER_API_KEY: str = os.getenv("MCP_SERVER_API_KEY", "")
    
    # Web Search Configuration
    WEB_SEARCH_ENABLED: bool = os.getenv("WEB_SEARCH_ENABLED", "true").lower() == "true"
    WEB_SEARCH_API_KEY: str = os.getenv("WEB_SEARCH_API_KEY", "")
    
    # CORS / Frontend origins (comma-separated). Example: "http://localhost:3000,https://your-app.vercel.app"
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    
    # Auth / OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    OAUTH_REDIRECT_URI: str = os.getenv(
        "OAUTH_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback"
    )
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings() 