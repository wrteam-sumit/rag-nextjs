from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
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
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    from app.core.database import ChatSession
    
    db_session = ChatSession(
        session_id=session.session_id,
        title=session.title
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[ChatSessionResponse])
async def get_chat_sessions(db: Session = Depends(get_db)):
    """Get all chat sessions"""
    from app.core.database import ChatSession
    return db.query(ChatSession).all()

@router.get("/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str, db: Session = Depends(get_db)):
    """Get a specific chat session"""
    from app.core.database import ChatSession
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@router.delete("/{session_id}")
async def delete_chat_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a chat session"""
    from app.core.database import ChatSession, Message
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Delete associated messages first
    messages = db.query(Message).filter(Message.session_id == session_id).all()
    for message in messages:
        db.delete(message)
    
    # Delete the session
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted successfully"} 