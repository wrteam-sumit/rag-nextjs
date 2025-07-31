from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app.models.document import get_all_documents
from pydantic import BaseModel
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
ai_service = AIService()
vector_service = VectorService()

class QueryRequest(BaseModel):
    question: str
    session_id: str = None  # Optional session ID to filter documents by chat creation time

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, str]]
    documents_found: int
    search_method: str
    ai_method: str
    embedding_method: str
    fallback_used: bool

@router.post("/", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """Query documents using RAG"""
    try:
        question = request.question.strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        logger.info(f"🔍 Processing question: {question}")
        logger.info(f"🔍 Session ID received: {request.session_id}")
        
        # Get chat session creation time if session_id is provided
        chat_creation_time = None
        logger.info(f"🔍 Request session_id: {request.session_id}")
        if request.session_id:
            from app.core.database import ChatSession
            chat_session = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
            if chat_session:
                chat_creation_time = chat_session.created_at
                logger.info(f"🔍 Filtering documents for chat session {request.session_id} created at {chat_creation_time}")
                logger.info(f"🔍 Chat session found: {chat_session.session_id}")
            else:
                logger.warning(f"❌ Chat session {request.session_id} not found")
                logger.warning(f"❌ Available chat sessions: {[cs.session_id for cs in db.query(ChatSession).all()]}")
        else:
            logger.info("🔍 No session_id provided, searching all documents")
        
        logger.info(f"🔍 Final chat_creation_time: {chat_creation_time}")
        
        # Create question embeddings
        query_embeddings = await ai_service.create_question_embeddings(question)
        
        # Search for relevant documents
        search_results = []
        search_method = "fallback"
        embedding_method = "all-minilm-l6-v2"  # Updated to use all-MiniLM-L6-v2
        
        # Try vector search first
        if vector_service.is_available():
            try:
                vector_results = vector_service.search_documents(query_embeddings, limit=10)  # Increased limit for filtering
                logger.info(f"🔍 Vector search returned {len(vector_results)} results")
                
                if vector_results:
                    # Filter results based on chat creation time
                    logger.info(f"🔍 About to check filtering condition: chat_creation_time = {chat_creation_time}")
                    
                    # Always apply filtering if chat_creation_time is provided
                    if chat_creation_time is not None:
                        filtered_results = []
                        logger.info(f"🔍 Starting filtering with chat creation time: {chat_creation_time}")
                        logger.info(f"🔍 Number of vector results to filter: {len(vector_results)}")
                        
                        # Get all documents from database for comparison
                        from app.core.database import Document
                        all_docs = {doc.document_id: doc for doc in db.query(Document).all()}
                        logger.info(f"🔍 Found {len(all_docs)} documents in database")
                        
                        for i, result in enumerate(vector_results):
                            filename = result.get('payload', {}).get('filename', 'unknown')
                            logger.info(f"🔍 Processing result {i+1}: {filename}")
                            
                            if "payload" in result:
                                payload = result["payload"]
                                document_id = payload.get("document_id")
                                
                                # Try to find document by document_id first, then by filename
                                doc = None
                                if document_id and document_id in all_docs:
                                    doc = all_docs[document_id]
                                    logger.info(f"🔍 Found document by ID: {document_id}")
                                else:
                                    # Try to find by filename
                                    for db_doc in all_docs.values():
                                        if db_doc.filename == filename:
                                            doc = db_doc
                                            logger.info(f"🔍 Found document by filename: {filename} -> {db_doc.document_id}")
                                            break
                                
                                if doc:
                                    logger.info(f"🔍 Document {doc.filename} uploaded at {doc.upload_date}")
                                    logger.info(f"🔍 Chat created at {chat_creation_time}")
                                    logger.info(f"🔍 Comparison: {doc.upload_date} > {chat_creation_time} = {doc.upload_date > chat_creation_time}")
                                    
                                    if doc.upload_date > chat_creation_time:
                                        filtered_results.append(result)
                                        logger.info(f"✅ INCLUDED document {doc.filename} (uploaded after chat)")
                                    else:
                                        logger.info(f"❌ EXCLUDED document {doc.filename} (uploaded before chat)")
                                else:
                                    logger.warning(f"⚠️ Could not find document for {filename}")
                                    logger.warning(f"⚠️ This result will NOT be included in filtered_results")
                            else:
                                logger.warning(f"⚠️ Result {i+1} has no payload")
                        
                        search_results = filtered_results[:3]  # Limit to top 3 after filtering
                        logger.info(f"🔍 Final filtered results: {len(filtered_results)} documents")
                        logger.info(f"🔍 search_results set to: {len(search_results)} documents")
                    else:
                        # No chat_creation_time, use all results
                        search_results = vector_results[:3]
                        logger.info(f"🔍 No filtering applied, using top 3 results")
                        logger.info(f"🔍 search_results set to: {len(search_results)} documents")
                    
                    search_method = "qdrant"
                    logger.info(f"🔍 Final search results: {len(search_results)} documents")
            except Exception as e:
                logger.warning(f"Vector search failed: {str(e)}")
        
        # Fallback to keyword search if no vector results
        if not search_results:
            search_results = await _fallback_search(question, db, chat_creation_time)
            search_method = "fallback"
            logger.info(f"🔍 Using fallback search, found {len(search_results)} documents")
        else:
            logger.info(f"🔍 Using vector search, found {len(search_results)} documents")
        
        if not search_results:
            # Check if there are any documents
            all_docs = get_all_documents(db)
            if not all_docs:
                raise HTTPException(
                    status_code=404,
                    detail="No documents found. Please upload some documents first."
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Found {len(all_docs)} document(s) but none match your question. Try rephrasing your question."
                )
        
        # Build context from search results
        context = _build_context(search_results)
        
        # Generate AI response
        try:
            answer = await ai_service.generate_response(question, context)
            ai_method = "gemini"  # Updated to use Google Gemini
        except Exception as e:
            logger.warning(f"AI generation failed: {str(e)}")
            answer = _create_fallback_response(search_results, question)
            ai_method = "fallback"
        
        # Prepare sources
        sources = []
        for result in search_results:
            if "payload" in result:
                metadata = result["payload"]
                sources.append({
                    "filename": metadata.get("filename", "Unknown"),
                    "relevance": f"{result.get('score', 0):.3f}"
                })
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            documents_found=len(search_results),
            search_method=search_method,
            ai_method=ai_method,
            embedding_method=embedding_method,
            fallback_used=search_method == "fallback" or ai_method == "fallback"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def _fallback_search(question: str, db: Session, chat_creation_time=None) -> List[Dict[str, Any]]:
    """Fallback keyword-based search"""
    try:
        documents = get_all_documents(db)
        if not documents:
            return []
        
        # Filter documents by chat creation time if provided
        if chat_creation_time:
            documents = [doc for doc in documents if doc.upload_date > chat_creation_time]
            logger.info(f"Filtered to {len(documents)} documents uploaded after chat creation")
        
        # Simple keyword matching
        question_lower = question.lower()
        keywords = [word for word in question_lower.split() if len(word) > 2]
        
        scored_docs = []
        for doc in documents:
            if not doc.text_content:
                continue
                
            text_lower = doc.text_content.lower()
            score = sum(text_lower.count(keyword) for keyword in keywords)
            
            if score > 0:
                scored_docs.append({
                    "score": score / len(keywords),
                    "payload": {
                        "text": doc.text_content,
                        "filename": doc.filename,
                        "document_id": doc.document_id
                    }
                })
        
        # Sort by score and return top results
        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return scored_docs[:3]
        
    except Exception as e:
        logger.error(f"Fallback search failed: {str(e)}")
        return []

def _build_context(search_results: List[Dict[str, Any]]) -> str:
    """Build context string from search results"""
    context_parts = []
    
    for i, result in enumerate(search_results):
        if "payload" in result:
            payload = result["payload"]
            text = payload.get("text", "")
            filename = payload.get("filename", "Unknown")
            score = result.get("score", 0)
            
            context_parts.append(
                f"[Document {i+1}: {filename}, Relevance: {score:.3f}]\n{text}"
            )
    
    context = "\n\n".join(context_parts)
    
    # Limit context size
    max_size = 30000
    if len(context) > max_size:
        context = context[:max_size] + "\n\n[Content truncated due to size limits...]"
    
    return context

def _create_fallback_response(search_results: List[Dict[str, Any]], question: str) -> str:
    """Create fallback response when AI is unavailable"""
    response_parts = [f"I found {len(search_results)} relevant document(s), but I'm having trouble processing them with AI right now. Here's what I found:\n"]
    
    for i, result in enumerate(search_results):
        if "payload" in result:
            payload = result["payload"]
            filename = payload.get("filename", "Unknown")
            text = payload.get("text", "")
            score = result.get("score", 0)
            
            preview = text[:500] + "..." if len(text) > 500 else text
            response_parts.append(
                f"{i+1}. {filename} (relevance: {score:.3f})\nContent Preview: {preview}\n"
            )
    
    response_parts.append("\nNote: The AI service is temporarily unavailable. Please try again in a few minutes for a more detailed analysis.")
    
    return "\n".join(response_parts) 