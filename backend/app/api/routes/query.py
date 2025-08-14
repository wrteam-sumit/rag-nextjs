from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app.services.multi_agent_service import AIService as MultiAgentService
from app.models.document import get_all_documents, get_documents_by_session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()
ai_service = AIService()
vector_service = VectorService()
multi_agent_service = MultiAgentService()

class QueryRequest(BaseModel):
    question: str
    session_id: str = None  # Optional session ID to filter documents by chat creation time
    use_web_search: bool = True  # Whether to use web search when context is insufficient

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, str]]
    documents_found: int
    search_method: str
    ai_method: str
    embedding_method: str
    fallback_used: bool
    assistant_name: str
    assistant_description: str
    web_search_used: bool = False
    model_used: str

@router.post("/", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication
):
    """Query documents using RAG with AI assistant and web search for the authenticated user"""
    try:
        question = request.question.strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        logger.info(f"🔍 Processing question for user {current_user.user_id}: {question}")
        logger.info(f"🔍 Session ID received: {request.session_id}")
        logger.info(f"🔍 Web search enabled: {request.use_web_search}")
        
        # Get chat session creation time if session_id is provided
        chat_creation_time = None
        logger.info(f"🔍 Request session_id: {request.session_id}")
        if request.session_id:
            from app.core.database import ChatSession
            # Ensure the chat session belongs to the current user
            chat_session = db.query(ChatSession).filter(
                ChatSession.session_id == request.session_id,
                ChatSession.user_id == current_user.user_id
            ).first()
            if chat_session:
                chat_creation_time = chat_session.created_at
                logger.info(f"🔍 Filtering documents for chat session {request.session_id} created at {chat_creation_time}")
                logger.info(f"🔍 Chat session found: {chat_session.session_id}")
            else:
                logger.warning(f"❌ Chat session {request.session_id} not found or access denied for user {current_user.user_id}")
                logger.warning(f"❌ Available chat sessions for user: {[cs.session_id for cs in db.query(ChatSession).filter(ChatSession.user_id == current_user.user_id).all()]}")
        else:
            logger.info("🔍 No session_id provided, searching all user documents")
        
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
                # Use session-based search if session_id is provided
                if request.session_id:
                    vector_results = vector_service.search_documents_with_session_filter(
                        query_embeddings, 
                        current_user.user_id,
                        request.session_id,
                        limit=10
                    )
                    logger.info(f"🔍 Session-based vector search returned {len(vector_results)} results for user {current_user.user_id}, session {request.session_id}")
                    
                    # If no session-specific results, fall back to user-based search
                    if not vector_results:
                        logger.info("🔄 No session-specific documents found, falling back to user-based search")
                        vector_results = vector_service.search_documents_with_user_filter(
                            query_embeddings, 
                            current_user.user_id,
                            limit=10
                        )
                        logger.info(f"🔍 User-based vector search returned {len(vector_results)} results for user {current_user.user_id}")
                        search_method = "user_vector_search_fallback"
                    else:
                        search_method = "session_vector_search"
                else:
                    # Fallback to user-based search if no session_id
                    vector_results = vector_service.search_documents_with_user_filter(
                        query_embeddings, 
                        current_user.user_id,
                        limit=10
                    )
                    logger.info(f"🔍 User-based vector search returned {len(vector_results)} results for user {current_user.user_id}")
                    search_method = "user_vector_search"
                
                if vector_results:
                    search_results = vector_results
                    logger.info(f"✅ Vector search successful: {len(search_results)} results")
                else:
                    logger.warning("❌ Vector search returned no results")
            except Exception as e:
                logger.error(f"❌ Vector search failed: {str(e)}")
        
        # Fallback to full-text search if vector search failed or returned no results
        if not search_results:
            try:
                logger.info("🔄 Falling back to full-text search")
                
                # Get documents for the user and session
                if request.session_id:
                    # Get documents for specific session
                    all_documents = get_documents_by_session(db, current_user.user_id, request.session_id)
                    logger.info(f"🔍 Found {len(all_documents)} documents for user {current_user.user_id}, session {request.session_id}")
                    
                    # If no session-specific documents, fall back to all user documents
                    if not all_documents:
                        logger.info("🔄 No session-specific documents found, falling back to all user documents")
                        all_documents = get_all_documents(db, current_user.user_id)
                        logger.info(f"🔍 Found {len(all_documents)} total documents for user {current_user.user_id}")
                        search_method = "full_text_search_fallback"
                    else:
                        search_method = "session_full_text_search"
                else:
                    # Get all documents for the user (fallback)
                    all_documents = get_all_documents(db, current_user.user_id)
                    logger.info(f"🔍 Found {len(all_documents)} total documents for user {current_user.user_id}")
                    search_method = "full_text_search"
                
                if all_documents:
                    # Simple keyword matching
                    question_lower = question.lower()
                    relevant_docs = []
                    
                    for doc in all_documents:
                        # Check if question keywords appear in document content
                        doc_content_lower = doc.text_content.lower() if doc.text_content else ""
                        question_words = question_lower.split()
                        
                        # Count matching words
                        matches = sum(1 for word in question_words if len(word) > 3 and word in doc_content_lower)
                        
                        if matches > 0:
                            relevance_score = matches / len(question_words)
                            relevant_docs.append({
                                'id': doc.id,
                                'filename': doc.filename,
                                'content': doc.text_content,
                                'relevance_score': relevance_score,
                                'metadata': {
                                    'upload_date': doc.upload_date.isoformat(),
                                    'user_id': doc.user_id,
                                    'session_id': doc.session_id
                                }
                            })
                    
                    # Sort by relevance and take top results
                    relevant_docs.sort(key=lambda x: x['relevance_score'], reverse=True)
                    search_results = relevant_docs[:5]
                    search_method = "session_full_text_search" if request.session_id else "full_text_search"
                    logger.info(f"✅ Full-text search successful: {len(search_results)} results")
                else:
                    logger.warning("❌ No documents found for user")
            except Exception as e:
                logger.error(f"❌ Full-text search failed: {str(e)}")
        
        # Prepare context from search results
        context = ""
        sources = []
        documents_found = len(search_results)
        
        if search_results:
            logger.info(f"📄 Processing {len(search_results)} search results")
            
            for i, result in enumerate(search_results):
                try:
                    # Handle different result structures
                    if 'payload' in result:
                        # Vector search result structure
                        payload = result.get('payload', {})
                        filename = payload.get('filename', f'Document {i+1}')
                        content = payload.get('text', '')
                        relevance = result.get('score', 'Unknown')
                    else:
                        # Full-text search result structure
                        filename = result.get('filename', f'Document {i+1}')
                        content = result.get('content', '')
                        relevance = result.get('relevance_score', 'Unknown')
                    
                    # Add to context
                    context += f"\n--- Document {i+1}: {filename} ---\n"
                    context += f"Relevance: {relevance}\n"
                    context += f"Content:\n{content}\n"
                    
                    # Add to sources
                    sources.append({
                        "filename": filename,
                        "relevance": str(relevance)
                    })
                    
                except Exception as e:
                    logger.error(f"❌ Error processing search result {i}: {str(e)}")
                    continue
        
        # Generate AI response
        logger.info("🤖 Generating AI response")
        web_search_results = None
        
        # Check if we need web search
        if request.use_web_search and (not context or len(context.strip()) < 100):
            logger.info("🌐 Context insufficient, performing web search")
            try:
                web_search_results = await multi_agent_service.search_web(question)
                if web_search_results:
                    logger.info("✅ Web search successful")
                else:
                    logger.warning("❌ Web search returned no results")
            except Exception as e:
                logger.error(f"❌ Web search failed: {str(e)}")
        
        # Generate response using the simplified AI service
        ai_response = await multi_agent_service.generate_response(
            question=question,
            context=context,
            web_search_results=web_search_results
        )
        
        # Extract response data
        answer = ai_response.get("answer", "I'm sorry, I couldn't generate a response.")
        assistant_name = ai_response.get("assistant_name", "AI Assistant")
        assistant_description = ai_response.get("assistant_description", "General purpose AI assistant")
        model_used = ai_response.get("model_used", "Unknown")
        web_search_used = ai_response.get("web_search_used", False)
        fallback_used = ai_response.get("fallback_response", False)
        
        logger.info(f"✅ Response generated successfully")
        logger.info(f"📊 Documents found: {documents_found}")
        logger.info(f"🔍 Search method: {search_method}")
        logger.info(f"🤖 AI method: {assistant_name}")
        logger.info(f"🌐 Web search used: {web_search_used}")
        logger.info(f"⚠️ Fallback used: {fallback_used}")
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            documents_found=documents_found,
            search_method=search_method,
            ai_method=assistant_name,
            embedding_method=embedding_method,
            fallback_used=fallback_used,
            assistant_name=assistant_name,
            assistant_description=assistant_description,
            web_search_used=web_search_used,
            model_used=model_used
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/domains")
async def get_available_domains():
    """Get available AI assistant information"""
    try:
        # Return simplified assistant information
        return {
            "assistants": [
                {
                    "id": "general",
                    "name": "AI Assistant",
                    "description": "General purpose AI assistant for document analysis and web search"
                }
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get assistant information: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get assistant information") 