import google.generativeai as genai
from app.core.config import settings
import logging
from typing import List, Dict, Any
import random
import hashlib
import requests

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Initialize Google Gemini only if API key is available
        self.google_api_available = bool(settings.GOOGLE_API_KEY)
        if self.google_api_available:
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.generation_model = genai.GenerativeModel(settings.GENERATION_MODEL)
                logger.info("Google Gemini API configured successfully")
            except Exception as e:
                logger.error(f"Failed to configure Google Gemini: {str(e)}")
                self.google_api_available = False
        else:
            logger.warning("GOOGLE_API_KEY not configured. AI generation will use fallback responses.")
        
        # Initialize all-MiniLM-L6-v2 for embeddings
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        logger.info("Using all-MiniLM-L6-v2 for embeddings and Google Gemini for generation")
    
    async def create_embeddings(self, text: str) -> List[float]:
        """Create embeddings using all-MiniLM-L6-v2 via Hugging Face API"""
        try:
            # Use Hugging Face Inference API for all-MiniLM-L6-v2
            return await self._create_all_minilm_embeddings(text)
        except Exception as e:
            logger.error(f"all-MiniLM-L6-v2 embedding failed: {str(e)}")
            return self._create_enhanced_embeddings(text)
    
    def _create_enhanced_embeddings(self, text: str) -> List[float]:
        """Create enhanced semantic embeddings"""
        try:
            # Create multiple hashes for better semantic representation
            import re
            
            # Clean and normalize text
            text_clean = re.sub(r'[^\w\s]', ' ', text.lower())
            words = text_clean.split()
            
            # Create embeddings from different text representations
            embeddings = []
            
            # 1. Full text hash
            full_hash = hashlib.md5(text.encode()).hexdigest()
            embeddings.extend([(int(full_hash[i:i+2], 16) - 128) / 128.0 for i in range(0, min(len(full_hash), 64), 2)])
            
            # 2. Word-based hash
            word_hash = hashlib.md5(' '.join(words[:10]).encode()).hexdigest()
            embeddings.extend([(int(word_hash[i:i+2], 16) - 128) / 128.0 for i in range(0, min(len(word_hash), 64), 2)])
            
            # 3. Length-based features
            embeddings.extend([
                len(text) / 10000.0,  # Normalized length
                len(words) / 100.0,   # Word count
                len(set(words)) / len(words) if words else 0.0  # Vocabulary diversity
            ])
            
            # Pad to 768 dimensions (Qdrant expects 768)
            while len(embeddings) < 768:
                embeddings.append(0.0)
            embeddings = embeddings[:768]
            
            return embeddings
        except Exception as e:
            logger.error(f"Enhanced embedding creation failed: {str(e)}")
            return self._create_hash_embeddings(text)
    
    async def _create_all_minilm_embeddings(self, text: str) -> List[float]:
        """Create embeddings using all-MiniLM-L6-v2 via Hugging Face API"""
        try:
            # Use Hugging Face Inference API for all-MiniLM-L6-v2
            # This doesn't require local PyTorch installation
            api_url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
            
            headers = {
                "Content-Type": "application/json",
            }
            
            payload = {
                "inputs": text,
                "options": {
                    "wait_for_model": True
                }
            }
            
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                embeddings = response.json()
                # all-MiniLM-L6-v2 produces 384-dimensional embeddings
                # We need to pad to 768 for Qdrant
                if len(embeddings) == 384:
                    # Pad to 768 dimensions
                    embeddings.extend([0.0] * 384)
                elif len(embeddings) < 768:
                    embeddings.extend([0.0] * (768 - len(embeddings)))
                else:
                    embeddings = embeddings[:768]
                
                logger.info(f"Created embeddings using all-MiniLM-L6-v2: {len(embeddings)} dimensions")
                return embeddings
            else:
                logger.warning(f"Hugging Face API failed: {response.status_code}")
                # Fallback to enhanced embeddings instead of raising
                logger.info("Falling back to enhanced hash embeddings")
                return self._create_enhanced_embeddings(text)
                
        except Exception as e:
            logger.error(f"all-MiniLM-L6-v2 embedding failed: {str(e)}")
            # Fallback to enhanced embeddings
            logger.info("Falling back to enhanced hash embeddings")
            return self._create_enhanced_embeddings(text)
    
    def _create_hash_embeddings(self, text: str) -> List[float]:
        """Fallback hash-based embeddings"""
        try:
            text_hash = hashlib.md5(text.encode()).hexdigest()
            
            # Convert hash to a list of floats (768 dimensions for Qdrant)
            embedding = []
            for i in range(0, len(text_hash), 2):
                if len(embedding) >= 768:
                    break
                hex_pair = text_hash[i:i+2]
                embedding.append((int(hex_pair, 16) - 128) / 128.0)
            
            # Pad or truncate to exactly 768 dimensions
            while len(embedding) < 768:
                embedding.append(0.0)
            embedding = embedding[:768]
            
            return embedding
        except Exception as e:
            logger.error(f"Hash embedding creation failed: {str(e)}")
            return [random.random() - 0.5 for _ in range(768)]
    
    async def generate_response(self, question: str, context: str) -> str:
        """Generate response using Google Gemini"""
        try:
            # Check if Google API is available
            if not self.google_api_available:
                logger.warning("Google API not available, using fallback response")
                return self._create_fallback_response_from_context(context, question)
            
            # Limit context size to avoid Gemini API limits
            max_context_length = 15000  # Reduced from 30000 to be safe
            if len(context) > max_context_length:
                context = context[:max_context_length] + "\n\n[Content truncated due to size limits...]"
            
            prompt = f"""You are a helpful AI assistant that answers questions based on the provided document context.

Instructions:
- Answer based ONLY on the information provided in the context
- If the context doesn't contain enough information to answer the question, say so
- Be concise but thorough
- Cite which document the information comes from when possible
- If you're not sure about something, acknowledge the uncertainty

Context from uploaded documents:

{context}

Question: {question}"""

            logger.info(f"Generating response with context length: {len(context)}")
            result = self.generation_model.generate_content(prompt)
            
            if result and result.text:
                logger.info("Successfully generated response from Gemini")
                return result.text
            else:
                logger.warning("Gemini returned empty response")
                return self._create_fallback_response_from_context(context, question)
                
        except Exception as e:
            logger.error(f"AI generation failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            return self._create_fallback_response_from_context(context, question)
    
    def _create_fallback_response_from_context(self, context: str, question: str) -> str:
        """Create a better fallback response when Gemini fails"""
        try:
            # Extract relevant information from context
            lines = context.split('\n')
            relevant_info = []
            
            # Look for document information
            for line in lines:
                if 'filename' in line.lower() or 'document' in line.lower():
                    relevant_info.append(line.strip())
                elif len(line.strip()) > 50:  # Add substantial content lines
                    relevant_info.append(line.strip())
            
            # Limit the information to avoid overwhelming response
            relevant_info = relevant_info[:10]
            
            response = f"I found relevant documents but I'm having trouble processing them with AI right now. Here's what I found:\n\n"
            response += "\n".join(relevant_info)
            response += f"\n\nQuestion asked: {question}"
            response += "\n\nNote: The AI service is temporarily unavailable. Please try again in a few minutes for a more detailed analysis."
            
            return response
            
        except Exception as e:
            logger.error(f"Fallback response creation failed: {str(e)}")
            return f"I found relevant documents but I'm having trouble processing them right now. Please try again later."
    
    async def create_question_embeddings(self, question: str) -> List[float]:
        """Create embeddings for a question"""
        return await self.create_embeddings(question) 