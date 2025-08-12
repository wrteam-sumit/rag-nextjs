import os
from pydantic_settings import BaseSettings
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
    
    # AI Models - Multiple models for different domains
    EMBEDDING_MODEL: str = "embedding-001"
    GENERATION_MODEL: str = "gemini-1.5-flash"
    
    # Domain-specific models
    HEALTH_MODEL: str = "gemini-1.5-flash"  # Can be different model for health
    AGRICULTURE_MODEL: str = "gemini-1.5-flash"  # Can be different model for agriculture
    LEGAL_MODEL: str = "gemini-1.5-flash"  # Can be different model for legal
    FINANCE_MODEL: str = "gemini-1.5-flash"  # Can be different model for finance
    EDUCATION_MODEL: str = "gemini-1.5-flash"  # Can be different model for education
    GENERAL_MODEL: str = "gemini-1.5-flash"  # General purpose model
    
    # MCP Server Configuration
    MCP_SERVER_ENABLED: bool = os.getenv("MCP_SERVER_ENABLED", "true").lower() == "true"
    MCP_SERVER_URL: str = os.getenv("MCP_SERVER_URL", "http://localhost:3001")
    MCP_SERVER_API_KEY: str = os.getenv("MCP_SERVER_API_KEY", "")
    
    # Web Search Configuration
    WEB_SEARCH_ENABLED: bool = os.getenv("WEB_SEARCH_ENABLED", "true").lower() == "true"
    WEB_SEARCH_API_KEY: str = os.getenv("WEB_SEARCH_API_KEY", "")
    
    # CORS / Frontend origins (comma-separated). Example: "http://localhost:3000,https://your-app.vercel.app"
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    
    class Config:
        env_file = ".env"

settings = Settings() 