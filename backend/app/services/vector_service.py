from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.core.config import settings
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        try:
            self.client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
            )
            self.collection_name = "documents"
            self._ensure_collection_exists()
        except Exception as e:
            logger.error(f"Qdrant connection failed: {str(e)}")
            self.client = None
    
    def _ensure_collection_exists(self):
        """Ensure the documents collection exists"""
        if not self.client:
            return
        
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
                )
                logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Collection creation failed: {str(e)}")
    
    def store_document(self, document_id: str, text: str, embeddings: List[float], metadata: Dict[str, Any]):
        """Store document in vector database"""
        if not self.client:
            raise Exception("Qdrant client not available")
        
        try:
            # Convert document_id to a hash for Qdrant compatibility
            import hashlib
            point_id = int(hashlib.md5(document_id.encode()).hexdigest()[:8], 16)
            
            point = PointStruct(
                id=point_id,
                vector=embeddings,
                payload={
                    "text": text,
                    "document_id": document_id,
                    **metadata
                }
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            logger.info(f"Stored document {document_id} in vector database")
        except Exception as e:
            logger.error(f"Vector storage failed: {str(e)}")
            raise
    
    def search_documents(self, query_embeddings: List[float], limit: int = 3) -> List[Dict[str, Any]]:
        """Search for similar documents (all users)"""
        if not self.client:
            return []
        
        try:
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embeddings,
                limit=limit
            )
            
            return [
                {
                    "score": result.score,
                    "payload": result.payload,
                    "id": result.id
                }
                for result in search_result
            ]
        except Exception as e:
            logger.error(f"Vector search failed: {str(e)}")
            return []
    
    def search_documents_with_session_filter(self, query_embeddings: List[float], user_id: str, session_id: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search for similar documents for a specific user and session"""
        if not self.client:
            return []
        
        try:
            # Create filter for user_id and session_id
            session_filter = Filter(
                must=[
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    ),
                    FieldCondition(
                        key="session_id",
                        match=MatchValue(value=session_id)
                    )
                ]
            )
            
            logger.info(f"🔍 Searching for documents with user_id: {user_id}, session_id: {session_id}")
            logger.info(f"🔍 Query embeddings length: {len(query_embeddings)}")
            
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embeddings,
                query_filter=session_filter,
                limit=limit
            )
            
            logger.info(f"🔍 Session-based vector search returned {len(search_result)} results")
            
            results = []
            for i, result in enumerate(search_result):
                payload = result.payload
                logger.info(f"🔍 Result {i+1}: score={result.score}, payload_keys={list(payload.keys())}")
                logger.info(f"🔍 Result {i+1}: filename={payload.get('filename', 'Unknown')}")
                logger.info(f"🔍 Result {i+1}: text_length={len(payload.get('text', ''))}")
                logger.info(f"🔍 Result {i+1}: session_id={payload.get('session_id', 'Unknown')}")
                
                results.append({
                    "score": result.score,
                    "payload": result.payload,
                    "id": result.id
                })
            
            return results
        except Exception as e:
            logger.error(f"Session-based vector search failed: {str(e)}")
            return []
    
    def search_documents_with_user_filter(self, query_embeddings: List[float], user_id: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search for similar documents for a specific user"""
        if not self.client:
            return []
        
        try:
            # Create filter for user_id
            user_filter = Filter(
                must=[
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    )
                ]
            )
            
            logger.info(f"🔍 Searching for documents with user_id: {user_id}")
            logger.info(f"🔍 Query embeddings length: {len(query_embeddings)}")
            
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embeddings,
                query_filter=user_filter,
                limit=limit
            )
            
            logger.info(f"🔍 Vector search returned {len(search_result)} results")
            
            results = []
            for i, result in enumerate(search_result):
                payload = result.payload
                logger.info(f"🔍 Result {i+1}: score={result.score}, payload_keys={list(payload.keys())}")
                logger.info(f"🔍 Result {i+1}: filename={payload.get('filename', 'Unknown')}")
                logger.info(f"🔍 Result {i+1}: text_length={len(payload.get('text', ''))}")
                
                results.append({
                    "score": result.score,
                    "payload": result.payload,
                    "id": result.id
                })
            
            return results
        except Exception as e:
            logger.error(f"Vector search with user filter failed: {str(e)}")
            return []
    
    def delete_document(self, document_id: str):
        """Delete document from vector database"""
        if not self.client:
            return
        
        try:
            # Convert document_id to a hash for Qdrant compatibility
            import hashlib
            point_id = int(hashlib.md5(document_id.encode()).hexdigest()[:8], 16)
            
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[point_id]
            )
            logger.info(f"Deleted document {document_id} from vector database")
        except Exception as e:
            logger.error(f"Vector deletion failed: {str(e)}")
    
    def clear_user_documents(self, user_id: str):
        """Clear all documents for a specific user from vector database"""
        if not self.client:
            return
        
        try:
            # Method 1: Try user-specific filter
            try:
                # Create filter for user_id
                user_filter = Filter(
                    must=[
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=user_id)
                        )
                    ]
                )
                
                # Delete all points matching the user filter
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector={"filter": user_filter}
                )
                logger.info(f"Cleared all documents for user {user_id} from vector database using filter")
                return
            except Exception as filter_error:
                logger.warning(f"User filter-based deletion failed: {str(filter_error)}")
            
            # Method 2: Get all points and filter by user_id in Python
            try:
                # Get all points in the collection
                all_points = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=1000,
                    with_payload=True,
                    with_vectors=False
                )
                
                points_to_delete = []
                for point in all_points[0]:  # all_points is a tuple (points, next_page_offset)
                    payload = point.payload
                    if payload.get('user_id') == user_id:
                        points_to_delete.append(point.id)
                
                if points_to_delete:
                    self.client.delete(
                        collection_name=self.collection_name,
                        points_selector=points_to_delete
                    )
                    logger.info(f"Cleared {len(points_to_delete)} documents for user {user_id} from vector database using scroll")
                else:
                    logger.info(f"No documents found for user {user_id} in vector database")
                    
            except Exception as scroll_error:
                logger.error(f"Scroll-based user deletion failed: {str(scroll_error)}")
                raise
                
        except Exception as e:
            logger.error(f"Vector clear user documents failed: {str(e)}")
            raise
    
    def clear_documents_without_upload_date(self):
        """Clear documents that don't have upload_date metadata (for backward compatibility)"""
        if not self.client:
            return
        
        try:
            # Get all points in the collection
            all_points = self.client.scroll(
                collection_name=self.collection_name,
                limit=1000,
                with_payload=True,
                with_vectors=False
            )
            
            points_to_delete = []
            for point in all_points[0]:  # all_points is a tuple (points, next_page_offset)
                payload = point.payload
                if 'upload_date' not in payload:
                    points_to_delete.append(point.id)
            
            if points_to_delete:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=points_to_delete
                )
                logger.info(f"Cleared {len(points_to_delete)} documents without upload_date metadata")
            else:
                logger.info("No documents without upload_date metadata found")
                
        except Exception as e:
            logger.error(f"Failed to clear documents without upload_date: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if Qdrant is available"""
        return self.client is not None
    
    def clear_all_documents(self):
        """Clear all documents from vector database"""
        if not self.client:
            return
        
        try:
            # Method 1: Try to delete all points using filter
            try:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector={"filter": {}}
                )
                logger.info("Cleared all documents from vector database using filter")
                return
            except Exception as filter_error:
                logger.warning(f"Filter-based deletion failed: {str(filter_error)}")
            
            # Method 2: Get all points and delete them individually
            try:
                # Get all points in the collection
                all_points = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=1000,  # Adjust based on your needs
                    with_payload=True,
                    with_vectors=False
                )
                
                if all_points[0]:  # If there are points
                    point_ids = [point.id for point in all_points[0]]
                    if point_ids:
                        self.client.delete(
                            collection_name=self.collection_name,
                            points_selector=point_ids
                        )
                        logger.info(f"Cleared {len(point_ids)} documents from vector database using scroll")
                    else:
                        logger.info("No documents found in vector database")
                else:
                    logger.info("No documents found in vector database")
                    
            except Exception as scroll_error:
                logger.error(f"Scroll-based deletion failed: {str(scroll_error)}")
                raise
                
        except Exception as e:
            logger.error(f"Vector clear all failed: {str(e)}")
            raise 