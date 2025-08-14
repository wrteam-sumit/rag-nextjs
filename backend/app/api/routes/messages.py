from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
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
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Create a new message for the authenticated user"""
    from app.core.database import Message, ChatSession
    
    # Validate message type
    if message.type not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Type must be 'user' or 'assistant'")
    
    # Verify the session belongs to the current user
    session = db.query(ChatSession).filter(
        ChatSession.session_id == message.session_id,
        ChatSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found or access denied")
    
    # Generate message ID
    message_id = str(uuid.uuid4())
    
    db_message = Message(
        message_id=message_id,
        session_id=message.session_id,
        type=message.type,
        content=message.content,
        sources=message.sources or [],
        metadata_json=message.metadata_json or {},
        user_id=current_user.user_id  # Associate with current user
    )
    
    db.add(db_message)
    
    # Update the chat session's updated_at timestamp when a new message is added
    session.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_message)
    
    return db_message

@router.get("/", response_model=List[MessageResponse])
async def get_messages(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Get messages for the authenticated user, optionally filtered by session_id"""
    from app.core.database import Message, ChatSession
    
    query = db.query(Message).filter(Message.user_id == current_user.user_id)
    
    if session_id:
        # Verify the session belongs to the current user
        session = db.query(ChatSession).filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == current_user.user_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found or access denied")
        query = query.filter(Message.session_id == session_id)
    
    messages = query.order_by(Message.timestamp.asc()).all()
    return messages

@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Get a specific message for the authenticated user"""
    from app.core.database import Message
    
    # Ensure user can only access their own messages
    message = db.query(Message).filter(
        Message.message_id == message_id,
        Message.user_id == current_user.user_id
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return message

@router.delete("/{message_id}")
async def delete_message(
    message_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Delete a message for the authenticated user"""
    from app.core.database import Message
    
    # Ensure user can only delete their own messages
    message = db.query(Message).filter(
        Message.message_id == message_id,
        Message.user_id == current_user.user_id
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    
    return {"message": "Message deleted successfully"}

@router.delete("/session/{session_id}")
async def delete_session_messages(
    session_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Delete all messages for a session belonging to the authenticated user"""
    from app.core.database import Message, ChatSession
    
    # Verify the session belongs to the current user
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found or access denied")
    
    # Delete messages for this session (they should all belong to the user)
    messages = db.query(Message).filter(Message.session_id == session_id).all()
    
    for message in messages:
        db.delete(message)
    
    db.commit()
    
    return {"message": f"Deleted {len(messages)} messages for session {session_id}"}

@router.delete("/clear-all")
async def clear_all_messages(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Delete all messages for the authenticated user"""
    from app.core.database import Message
    
    # Only delete messages belonging to current user
    messages = db.query(Message).filter(Message.user_id == current_user.user_id).all()
    message_count = len(messages)
    
    for message in messages:
        db.delete(message)
    
    db.commit()
    
    return {"message": f"Deleted {message_count} messages for the current user"} 