from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app.services.multi_agent_service import MultiAgentService, AgentDomain
from app.models.document import get_all_documents
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
ai_service = AIService()
vector_service = VectorService()
multi_agent_service = MultiAgentService()

class QueryRequest(BaseModel):
    question: str
    session_id: str = None  # Optional session ID to filter documents by chat creation time
    domain: Optional[str] = None  # Optional domain selection (health, agriculture, legal, finance, education, general)
    use_web_search: bool = True  # Whether to use web search when context is insufficient

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, str]]
    documents_found: int
    search_method: str
    ai_method: str
    embedding_method: str
    fallback_used: bool
    domain: str
    domain_name: str
    domain_description: str
    web_search_used: bool = False
    model_used: str

@router.post("/", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """Query documents using RAG with multi-agent system"""
    try:
        question = request.question.strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        logger.info(f"🔍 Processing question: {question}")
        logger.info(f"🔍 Session ID received: {request.session_id}")
        logger.info(f"🔍 Domain requested: {request.domain}")
        logger.info(f"🔍 Web search enabled: {request.use_web_search}")
        
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
                        
                        for result in vector_results:
                            if "payload" in result:
                                doc_id = result["payload"].get("document_id")
                                if doc_id in all_docs:
                                    doc = all_docs[doc_id]
                                    if doc.upload_date > chat_creation_time:
                                        filtered_results.append(result)
                                        logger.info(f"🔍 Added filtered result: {doc.filename}")
                                    else:
                                        logger.info(f"🔍 Skipped old document: {doc.filename} (uploaded {doc.upload_date})")
                        
                        search_results = filtered_results
                        search_method = "qdrant_filtered"
                        logger.info(f"🔍 After filtering: {len(search_results)} results")
                    else:
                        search_results = vector_results
                        search_method = "qdrant"
                else:
                    logger.info("🔍 No vector search results found")
                    
            except Exception as e:
                logger.warning(f"Vector search failed: {str(e)}")
        
        # If no vector results, try fallback search
        if not search_results:
            logger.info("🔍 No vector results, trying fallback search")
            search_results = await _fallback_search(question, db, chat_creation_time)
            if search_results:
                search_method = "fallback"
                logger.info(f"🔍 Fallback search returned {len(search_results)} results")
        
        # Build context from search results
        context = _build_context(search_results)
        
        # Check if we have any relevant context
        has_relevant_context = len(search_results) > 0 and any(
            result.get('score', 0) > 0.1 for result in search_results
        )
        
        # If no relevant context and web search is enabled, use web search directly
        if not has_relevant_context and request.use_web_search:
            logger.info("🔍 No relevant document context found, using web search directly")
            search_method = "web_search_only"
            context = "No relevant documents found. Using web search for information."
        elif not has_relevant_context:
            logger.warning("🔍 No relevant context found and web search is disabled")
            raise HTTPException(
                status_code=404, 
                detail="No relevant documents found. Please upload documents or enable web search."
            )
        
        # Determine domain for multi-agent system
        domain = None
        if request.domain:
            try:
                domain = AgentDomain(request.domain.lower())
                logger.info(f"🔍 Using requested domain: {domain.value}")
            except ValueError:
                logger.warning(f"Invalid domain requested: {request.domain}, will auto-detect")
                domain = None
        
        if domain is None:
            domain = multi_agent_service.detect_domain(question, context)
            logger.info(f"🔍 Auto-detected domain: {domain.value}")
        
        # Generate AI response using multi-agent system
        try:
            if request.use_web_search:
                # Use multi-agent service with web search fallback
                ai_result = await multi_agent_service.generate_response_with_web_search(question, context, domain)
            else:
                # Use multi-agent service without web search
                ai_result = await multi_agent_service.generate_response(question, context, domain)
            
            ai_method = "multi-agent"
            answer = ai_result["answer"]
            web_search_used = ai_result.get("web_search_used", False)
            model_used = ai_result.get("model_used", "unknown")
            
            # Update search method if web search was used
            if web_search_used and ai_result.get("search_method") == "web_search_only":
                search_method = "web_search_only"
            
            logger.info(f"🔍 Generated response using {domain.value} agent")
            logger.info(f"🔍 Web search used: {web_search_used}")
            logger.info(f"🔍 Search method: {search_method}")
            
        except Exception as e:
            logger.warning(f"Multi-agent generation failed: {str(e)}")
            # Fallback to original AI service
            try:
                answer = await ai_service.generate_response(question, context)
                ai_method = "gemini"
                web_search_used = False
                model_used = "gemini-1.5-flash"
            except Exception as e2:
                logger.warning(f"Fallback AI generation failed: {str(e2)}")
                answer = _create_fallback_response(search_results, question)
                ai_method = "fallback"
                web_search_used = False
                model_used = "fallback"
        
        # Prepare sources
        sources = []
        for result in search_results:
            if "payload" in result:
                metadata = result["payload"]
                sources.append({
                    "filename": metadata.get("filename", "Unknown"),
                    "relevance": f"{result.get('score', 0):.3f}"
                })
        
        # Get domain information
        domain_config = multi_agent_service.domain_configs[domain]
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            documents_found=len(search_results),
            search_method=search_method,
            ai_method=ai_method,
            embedding_method=embedding_method,
            fallback_used=search_method == "fallback" or ai_method == "fallback",
            domain=domain.value,
            domain_name=domain_config["name"],
            domain_description=domain_config["description"],
            web_search_used=web_search_used,
            model_used=model_used
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/domains")
async def get_available_domains():
    """Get list of available domains and their descriptions"""
    try:
        domains = multi_agent_service.get_available_domains()
        return {"domains": domains}
    except Exception as e:
        logger.error(f"Failed to get domains: {str(e)}")
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