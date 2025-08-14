#!/usr/bin/env python3
"""
Database migration script to add user_id columns to existing tables.
This script handles the transition from global data to user-specific data.

Run this script after updating the database schema but before starting the new version.
"""

import sys
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL with proper configuration"""
    raw_database_url = settings.DATABASE_URL or (
        f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )
    
    # Normalize 'postgres://' scheme to 'postgresql://' for SQLAlchemy
    if raw_database_url.startswith("postgres://"):
        raw_database_url = raw_database_url.replace("postgres://", "postgresql://", 1)
    
    # Enforce SSL by default for non-local hosts if not already specified
    if (
        "sslmode=" not in raw_database_url
        and not any(h in raw_database_url for h in ["localhost", "127.0.0.1"])
    ):
        separator = "&" if "?" in raw_database_url else "?"
        raw_database_url = f"{raw_database_url}{separator}sslmode=require"
    
    return raw_database_url

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    return any(col['name'] == column_name for col in columns)

def migrate_database():
    """Perform the database migration"""
    try:
        # Connect to database
        database_url = get_database_url()
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        logger.info("🔍 Starting database migration...")
        
        # Check if we need to migrate
        needs_migration = False
        
        # Check documents table
        if not check_column_exists(engine, "documents", "user_id"):
            needs_migration = True
            logger.info("📄 Documents table needs user_id column")
        
        # Check chat_sessions table
        if not check_column_exists(engine, "chat_sessions", "user_id"):
            needs_migration = True
            logger.info("💬 Chat sessions table needs user_id column")
        
        # Check messages table
        if not check_column_exists(engine, "messages", "user_id"):
            needs_migration = True
            logger.info("💭 Messages table needs user_id column")
        
        if not needs_migration:
            logger.info("✅ Database schema is already up to date!")
            return
        
        # Start migration
        logger.info("🚀 Starting migration process...")
        
        with engine.begin() as conn:
            # Add user_id column to documents table
            if not check_column_exists(engine, "documents", "user_id"):
                logger.info("📄 Adding user_id column to documents table...")
                conn.execute(text("""
                    ALTER TABLE documents 
                    ADD COLUMN user_id VARCHAR
                """))
                logger.info("✅ Added user_id column to documents table")
            
            # Add user_id column to chat_sessions table
            if not check_column_exists(engine, "chat_sessions", "user_id"):
                logger.info("💬 Adding user_id column to chat_sessions table...")
                conn.execute(text("""
                    ALTER TABLE chat_sessions 
                    ADD COLUMN user_id VARCHAR
                """))
                logger.info("✅ Added user_id column to chat_sessions table")
            
            # Add user_id column to messages table
            if not check_column_exists(engine, "messages", "user_id"):
                logger.info("💭 Adding user_id column to messages table...")
                conn.execute(text("""
                    ALTER TABLE messages 
                    ADD COLUMN user_id VARCHAR
                """))
                logger.info("✅ Added user_id column to messages table")
        
        # Check if there's existing data that needs to be handled
        with SessionLocal() as db:
            # Count existing records
            doc_count = db.execute(text("SELECT COUNT(*) FROM documents")).scalar()
            session_count = db.execute(text("SELECT COUNT(*) FROM chat_sessions")).scalar()
            message_count = db.execute(text("SELECT COUNT(*) FROM messages")).scalar()
            
            if doc_count > 0 or session_count > 0 or message_count > 0:
                logger.warning("⚠️  Found existing data in tables:")
                logger.warning(f"   - Documents: {doc_count}")
                logger.warning(f"   - Chat sessions: {session_count}")
                logger.warning(f"   - Messages: {message_count}")
                logger.warning("⚠️  This data will not be accessible until users are created and data is migrated.")
                logger.warning("⚠️  Consider creating a default user or migrating existing data.")
        
        logger.info("✅ Database migration completed successfully!")
        logger.info("🔧 You may need to update your vector database to include user_id metadata.")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        raise

def create_default_user():
    """Create a default user for existing data (optional)"""
    try:
        database_url = get_database_url()
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        with SessionLocal() as db:
            # Check if default user exists
            default_user = db.execute(
                text("SELECT * FROM users WHERE email = 'default@system.local'")
            ).first()
            
            if not default_user:
                logger.info("👤 Creating default user for existing data...")
                from datetime import datetime
                current_time = datetime.now().isoformat()
                db.execute(text("""
                    INSERT INTO users (user_id, email, name, provider, created_at, updated_at)
                    VALUES ('default_user', 'default@system.local', 'Default User', 'system', :created_at, :updated_at)
                """), {"created_at": current_time, "updated_at": current_time})
                db.commit()
                logger.info("✅ Created default user")
                
                # Assign existing data to default user
                logger.info("🔄 Assigning existing data to default user...")
                
                # Update documents
                doc_updated = db.execute(text("""
                    UPDATE documents SET user_id = 'default_user' WHERE user_id IS NULL
                """))
                logger.info(f"📄 Updated {doc_updated.rowcount} documents")
                
                # Update chat sessions
                session_updated = db.execute(text("""
                    UPDATE chat_sessions SET user_id = 'default_user' WHERE user_id IS NULL
                """))
                logger.info(f"💬 Updated {session_updated.rowcount} chat sessions")
                
                # Update messages
                message_updated = db.execute(text("""
                    UPDATE messages SET user_id = 'default_user' WHERE user_id IS NULL
                """))
                logger.info(f"💭 Updated {message_updated.rowcount} messages")
                
                db.commit()
                logger.info("✅ All existing data assigned to default user")
            else:
                logger.info("👤 Default user already exists")
        
    except Exception as e:
        logger.error(f"❌ Failed to create default user: {str(e)}")
        raise

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--create-default-user":
        logger.info("🔧 Running migration with default user creation...")
        migrate_database()
        create_default_user()
    else:
        logger.info("🔧 Running migration...")
        migrate_database()
        logger.info("💡 To create a default user for existing data, run: python migrate_user_schema.py --create-default-user")
