from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import DocumentCreate, DocumentResponse
from app.services.document_processor import DocumentProcessor
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
import uuid
import os
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
document_processor = DocumentProcessor()
ai_service = AIService()
vector_service = VectorService()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    try:
        # Validate file type
        supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.mdx', '.rtf']
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in supported_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported formats: {', '.join(supported_extensions)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Save file temporarily for OCR processing
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(content)
        
        try:
            # Extract text from document
            file_extension = os.path.splitext(file.filename)[1].lower()
            extraction_result = document_processor.extract_text(temp_path, content, file_extension)
            
            if not extraction_result["success"]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to extract text: {extraction_result.get('error', 'Unknown error')}"
                )
            
            text_content = extraction_result["text"]
            
            # Create embeddings
            embeddings = await ai_service.create_embeddings(text_content)
            
            # Generate document ID
            import time
            document_id = f"{os.path.splitext(file.filename)[0]}_{int(time.time() * 1000)}"
            
            # Save to database
            file_extension = os.path.splitext(file.filename)[1].lower()
            db_document = DocumentCreate(
                document_id=document_id,
                filename=file.filename,
                file_type=file_extension[1:],  # Remove the dot
                file_size=len(content),
                text_content=text_content,
                text_length=len(text_content),
                metadata_json={
                    "extraction_method": extraction_result["method"],
                    "file_size": len(content),
                    "filename": file.filename,
                    "file_extension": file_extension,
                    "text_length": len(text_content),
                    "vector_length": len(embeddings)
                }
            )
            
            # Save to PostgreSQL
            from app.core.database import Document
            document = Document(
                document_id=db_document.document_id,
                filename=db_document.filename,
                file_type=db_document.file_type,
                file_size=db_document.file_size,
                text_content=db_document.text_content,
                text_length=db_document.text_length,
                metadata_json=db_document.metadata_json
            )
            db.add(document)
            db.commit()
            db.refresh(document)
            
            # Save to vector database
            try:
                vector_service.store_document(
                    document_id=document_id,
                    text=text_content,
                    embeddings=embeddings,
                    metadata=db_document.metadata_json
                )
                vector_storage_method = "qdrant"
            except Exception as e:
                logger.warning(f"Vector storage failed: {str(e)}")
                vector_storage_method = "postgresql_only"
            
            return DocumentResponse(
                id=document.id,
                document_id=document.document_id,
                filename=document.filename,
                file_type=document.file_type,
                file_size=document.file_size,
                text_length=document.text_length,
                upload_date=document.upload_date,
                extraction_method=extraction_result["method"],
                vector_storage_method=vector_storage_method,
                success=True
            )
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(db: Session = Depends(get_db)):
    """Get all documents"""
    from app.core.database import Document
    documents = db.query(Document).all()
    return documents

@router.delete("/clear-all")
async def clear_all_documents(db: Session = Depends(get_db)):
    """Delete all documents from the database"""
    from app.core.database import Document
    
    documents = db.query(Document).all()
    document_count = len(documents)
    
    # Delete from PostgreSQL
    for document in documents:
        db.delete(document)
    db.commit()
    
    # Clear all from vector database
    try:
        vector_service.clear_all_documents()
        logger.info(f"Cleared {document_count} documents from database and vector store")
    except Exception as e:
        logger.warning(f"Vector clear all failed: {str(e)}")
    
    return {"message": f"Deleted {document_count} documents from the database"}

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: Session = Depends(get_db)):
    """Get a specific document"""
    from app.core.database import Document
    document = db.query(Document).filter(Document.document_id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document"""
    from app.core.database import Document
    document = db.query(Document).filter(Document.document_id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    
    # Also delete from vector database
    try:
        vector_service.delete_document(document_id)
    except Exception as e:
        logger.warning(f"Vector deletion failed: {str(e)}")
    
    return {"message": "Document deleted successfully"} 