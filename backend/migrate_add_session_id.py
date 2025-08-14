#!/usr/bin/env python3
"""
Migration script to add session_id column to documents table
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

def migrate_add_session_id():
    """Add session_id column to documents table"""
    
    print("🔄 Starting migration: Adding session_id column to documents table...")
    
    try:
        # Create a database session
        db = SessionLocal()
        
        # Check if session_id column already exists (SQLite syntax)
        result = db.execute(text("PRAGMA table_info(documents)"))
        columns = result.fetchall()
        column_names = [col[1] for col in columns]  # Column name is at index 1
        
        if 'session_id' in column_names:
            print("✅ session_id column already exists, skipping migration")
            return
        
        # Add session_id column
        print("📝 Adding session_id column...")
        db.execute(text("ALTER TABLE documents ADD COLUMN session_id VARCHAR"))
        
        # Commit the changes
        db.commit()
        print("✅ Successfully added session_id column to documents table")
        
        # Update existing documents to have NULL session_id (they will be treated as global documents)
        print("📝 Updating existing documents...")
        db.execute(text("UPDATE documents SET session_id = NULL WHERE session_id IS NULL"))
        
        db.commit()
        print("✅ Successfully updated existing documents")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_add_session_id()
    print("Migration completed!")
