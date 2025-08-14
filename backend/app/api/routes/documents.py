from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
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
    session_id: str = Form(None),  # NEW: Accept session_id from form
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Upload and process a document for the authenticated user"""
    try:
        # Validate file type
        supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.mdx', '.rtf']
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in supported_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported formats: {', '.join(supported_extensions)}"
            )
        
        # Validate session_id if provided
        if session_id:
            from app.core.database import ChatSession
            chat_session = db.query(ChatSession).filter(
                ChatSession.session_id == session_id,
                ChatSession.user_id == current_user.user_id
            ).first()
            if not chat_session:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid session_id or access denied"
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
                    "vector_length": len(embeddings),
                    "session_id": session_id  # NEW: Include session_id in metadata
                }
            )
            
            # Save to PostgreSQL with user association
            from app.core.database import Document
            document = Document(
                document_id=db_document.document_id,
                filename=db_document.filename,
                file_type=db_document.file_type,
                file_size=db_document.file_size,
                text_content=db_document.text_content,
                text_length=db_document.text_length,
                metadata_json=db_document.metadata_json,
                user_id=current_user.user_id,  # Associate with current user
                session_id=session_id  # NEW: Associate with chat session
            )
            db.add(document)
            db.commit()
            db.refresh(document)
            
            # Save to vector database with user context
            try:
                vector_service.store_document(
                    document_id=document_id,
                    text=text_content,
                    embeddings=embeddings,
                    metadata={
                        **db_document.metadata_json,
                        "user_id": current_user.user_id,  # Include user ID in metadata
                        "upload_date": document.upload_date.isoformat(),  # Include upload timestamp
                        "filename": document.filename,  # Include filename for better identification
                        "session_id": session_id  # NEW: Include session_id in metadata
                    }
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
async def get_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Get all documents for the authenticated user"""
    from app.core.database import Document
    # Filter documents by current user
    documents = db.query(Document).filter(Document.user_id == current_user.user_id).all()
    return documents

@router.delete("/clear-all")
async def clear_all_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Delete all documents for the authenticated user"""
    from app.core.database import Document
    
    logger.info(f"🗑️ Starting document cleanup for user {current_user.user_id}")
    
    # Step 1: Clear from vector database first (more aggressive approach)
    try:
        logger.info(f"🔍 Clearing vector database for user {current_user.user_id}")
        vector_service.clear_user_documents(current_user.user_id)
        logger.info(f"✅ Vector database cleared for user {current_user.user_id}")
    except Exception as e:
        logger.warning(f"⚠️ Vector clear user documents failed: {str(e)}")
        # Try alternative method - clear all documents from vector database
        try:
            logger.info("🔄 Trying alternative vector clearing method...")
            vector_service.clear_all_documents()
            logger.info("✅ Alternative vector clearing successful")
        except Exception as e2:
            logger.error(f"❌ Alternative vector clearing also failed: {str(e2)}")
    
    # Step 2: Clear old format documents from vector database
    try:
        logger.info("🔍 Clearing old format documents from vector database...")
        vector_service.clear_documents_without_upload_date()
        logger.info("✅ Old format documents cleared from vector database")
    except Exception as e:
        logger.warning(f"⚠️ Old format document clearing failed: {str(e)}")
    
    # Step 3: Clear from PostgreSQL
    try:
        # Only get documents belonging to current user
        documents = db.query(Document).filter(Document.user_id == current_user.user_id).all()
        document_count = len(documents)
        logger.info(f"📄 Found {document_count} documents in PostgreSQL for user {current_user.user_id}")
        
        # Delete from PostgreSQL
        for document in documents:
            db.delete(document)
        db.commit()
        logger.info(f"✅ Deleted {document_count} documents from PostgreSQL for user {current_user.user_id}")
        
        # Verify deletion
        remaining_docs = db.query(Document).filter(Document.user_id == current_user.user_id).count()
        if remaining_docs > 0:
            logger.warning(f"⚠️ {remaining_docs} documents still remain in PostgreSQL for user {current_user.user_id}")
        else:
            logger.info(f"✅ Verified: No documents remain in PostgreSQL for user {current_user.user_id}")
            
    except Exception as e:
        logger.error(f"❌ PostgreSQL document deletion failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete documents from database: {str(e)}")
    
    logger.info(f"✅ Complete document cleanup finished for user {current_user.user_id}")
    return {"message": f"Deleted {document_count} documents for the current user"}

@router.delete("/clear-old-format")
async def clear_old_format_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Clear documents without upload_date metadata (for backward compatibility)"""
    try:
        # Clear documents without upload_date from vector database
        vector_service.clear_documents_without_upload_date()
        
        return {"message": "Cleared old format documents from vector database"}
    except Exception as e:
        logger.error(f"Failed to clear old format documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Get a specific document for the authenticated user"""
    from app.core.database import Document
    # Ensure user can only access their own documents
    document = db.query(Document).filter(
        Document.document_id == document_id,
        Document.user_id == current_user.user_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Delete a document for the authenticated user"""
    from app.core.database import Document
    # Ensure user can only delete their own documents
    document = db.query(Document).filter(
        Document.document_id == document_id,
        Document.user_id == current_user.user_id
    ).first()
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