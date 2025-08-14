from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.core.database import Document as DocumentDB

class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int
    text_content: Optional[str] = None
    text_length: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None

class DocumentCreate(DocumentBase):
    document_id: str

class DocumentResponse(DocumentBase):
    id: int
    document_id: str
    upload_date: datetime
    extraction_method: Optional[str] = None
    vector_storage_method: Optional[str] = None
    success: bool = True

    class Config:
        from_attributes = True

# Database operations
def create_document(db: Session, document: DocumentCreate) -> DocumentDB:
    db_document = DocumentDB(
        document_id=document.document_id,
        filename=document.filename,
        file_type=document.file_type,
        file_size=document.file_size,
        text_content=document.text_content,
        text_length=document.text_length,
        metadata_json=document.metadata_json
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_all_documents(db: Session, user_id: str = None) -> List[DocumentDB]:
    query = db.query(DocumentDB)
    if user_id:
        query = query.filter(DocumentDB.user_id == user_id)
    return query.all()

def get_documents_by_session(db: Session, user_id: str, session_id: str) -> List[DocumentDB]:
    """Get documents for a specific user and session"""
    return db.query(DocumentDB).filter(
        DocumentDB.user_id == user_id,
        DocumentDB.session_id == session_id
    ).all()

def get_document_by_id(db: Session, document_id: str) -> Optional[DocumentDB]:
    return db.query(DocumentDB).filter(DocumentDB.document_id == document_id).first()

def delete_document_by_id(db: Session, document_id: str) -> bool:
    document = db.query(DocumentDB).filter(DocumentDB.document_id == document_id).first()
    if document:
        db.delete(document)
        db.commit()
        return True
    return False 