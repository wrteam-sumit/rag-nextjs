from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class ChatSessionCreate(BaseModel):
    session_id: str
    title: str

class ChatSessionResponse(BaseModel):
    id: int
    session_id: str
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=ChatSessionResponse)
async def create_chat_session(
    session: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Create a new chat session for the authenticated user"""
    from app.core.database import ChatSession
    
    # Check if session already exists for this user
    existing_session = db.query(ChatSession).filter(
        ChatSession.session_id == session.session_id,
        ChatSession.user_id == current_user.user_id
    ).first()
    
    if existing_session:
        # Update the existing session title if needed
        if existing_session.title != session.title:
            existing_session.title = session.title
            db.commit()
            db.refresh(existing_session)
        return existing_session
    
    # Create new session if it doesn't exist
    db_session = ChatSession(
        session_id=session.session_id,
        title=session.title,
        user_id=current_user.user_id  # Associate with current user
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Get all chat sessions for the authenticated user, ordered by most recently updated first"""
    from app.core.database import ChatSession
    # Filter sessions by current user and order by most recently updated first
    return db.query(ChatSession).filter(
        ChatSession.user_id == current_user.user_id
    ).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc()).all()

@router.get("/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Get a specific chat session for the authenticated user"""
    from app.core.database import ChatSession
    # Ensure user can only access their own sessions
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@router.delete("/{session_id}")
async def delete_chat_session(
    session_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Delete a chat session for the authenticated user"""
    from app.core.database import ChatSession, Message
    # Ensure user can only delete their own sessions
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Delete associated messages first (cascade should handle this, but being explicit)
    messages = db.query(Message).filter(Message.session_id == session_id).all()
    for message in messages:
        db.delete(message)
    
    # Delete the session
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted successfully"} 