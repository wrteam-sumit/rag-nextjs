from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

router = APIRouter()

class MessageCreate(BaseModel):
    session_id: str
    type: str  # "user" or "assistant"
    content: str
    sources: Optional[List[Dict[str, str]]] = None
    metadata_json: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    id: int
    message_id: str
    session_id: str
    type: str
    content: str
    sources: Optional[List[Dict[str, str]]] = None
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=MessageResponse)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db)
):
    """Create a new message"""
    from app.core.database import Message
    
    # Validate message type
    if message.type not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Type must be 'user' or 'assistant'")
    
    # Generate message ID
    message_id = str(uuid.uuid4())
    
    db_message = Message(
        message_id=message_id,
        session_id=message.session_id,
        type=message.type,
        content=message.content,
        sources=message.sources or [],
        metadata_json=message.metadata_json or {}
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

@router.get("/", response_model=List[MessageResponse])
async def get_messages(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get messages, optionally filtered by session_id"""
    from app.core.database import Message
    
    query = db.query(Message)
    
    if session_id:
        query = query.filter(Message.session_id == session_id)
    
    messages = query.order_by(Message.timestamp.asc()).all()
    return messages

@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(message_id: str, db: Session = Depends(get_db)):
    """Get a specific message"""
    from app.core.database import Message
    
    message = db.query(Message).filter(Message.message_id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return message

@router.delete("/{message_id}")
async def delete_message(message_id: str, db: Session = Depends(get_db)):
    """Delete a message"""
    from app.core.database import Message
    
    message = db.query(Message).filter(Message.message_id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    
    return {"message": "Message deleted successfully"}

@router.delete("/session/{session_id}")
async def delete_session_messages(session_id: str, db: Session = Depends(get_db)):
    """Delete all messages for a session"""
    from app.core.database import Message
    
    messages = db.query(Message).filter(Message.session_id == session_id).all()
    
    for message in messages:
        db.delete(message)
    
    db.commit()
    
    return {"message": f"Deleted {len(messages)} messages for session {session_id}"}

@router.delete("/clear-all")
async def clear_all_messages(db: Session = Depends(get_db)):
    """Delete all messages from the database"""
    from app.core.database import Message
    
    messages = db.query(Message).all()
    message_count = len(messages)
    
    for message in messages:
        db.delete(message)
    
    db.commit()
    
    return {"message": f"Deleted {message_count} messages from the database"} 