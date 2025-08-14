import google.generativeai as genai
from app.core.config import settings
import logging
from typing import List, Dict, Any, Optional
import requests
import json
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class AIService:
    """Simplified AI service for document RAG and web search functionality"""
    
    def __init__(self):
        # Initialize Google Gemini only if API key is available
        self.google_api_available = bool(settings.GOOGLE_API_KEY)
        logger.info(f"Google API key available: {self.google_api_available}")
        if settings.GOOGLE_API_KEY:
            logger.info(f"Google API key length: {len(settings.GOOGLE_API_KEY)} characters")
            if settings.GOOGLE_API_KEY == "your_google_api_key_here":
                logger.warning("Google API key is set to placeholder value. Please replace with actual API key.")
                self.google_api_available = False
            else:
                logger.info("Google API key appears to be properly configured")
        
        if self.google_api_available:
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                
                # Initialize single general model
                self.model = genai.GenerativeModel(settings.GENERATION_MODEL)
                logger.info("Google Gemini API configured successfully for AI service")
            except Exception as e:
                logger.error(f"Failed to configure Google Gemini for AI service: {str(e)}")
                self.google_api_available = False
                self.model = None
        else:
            logger.warning("GOOGLE_API_KEY not configured. AI service will use fallback responses.")
            self.model = None
        
        # General assistant configuration
        self.assistant_config = {
            "name": "AI Assistant",
            "description": "General purpose AI assistant for document analysis and web search",
            "system_prompt": """You are a helpful AI assistant that answers questions based on the provided document context and web search results.
            You provide accurate, helpful information across all topics while being clear about your limitations.
            
            When answering:
            - Use the document context as your primary source of information
            - If web search results are provided, incorporate them for current information
            - Be concise but thorough
            - Cite which document the information comes from when possible
            - If you're not sure about something, acknowledge the uncertainty
            - Always provide helpful, accurate information"""
        }
        
        logger.info("AI service initialized for document RAG and web search")
    
    async def generate_response(self, question: str, context: str, web_search_results: Optional[str] = None) -> Dict[str, Any]:
        """Generate response using the AI model with document context and optional web search results"""
        try:
            # Check if Google API is available
            if not self.google_api_available or not self.model:
                logger.warning("Google API not configured. Using fallback response.")
                return self._create_fallback_response(context, question, web_search_results)

            # Build prompt with context and web search results
            system_prompt = self.assistant_config["system_prompt"]
            
            # Limit context size to avoid API limits
            max_context_length = 15000
            if len(context) > max_context_length:
                context = context[:max_context_length] + "\n\n[Content truncated due to size limits...]"
            
            # Build the full prompt
            prompt_parts = [system_prompt, "\nInstructions:", "- Answer based on the information provided in the context and web search results", "- Be concise but thorough", "- Cite which document the information comes from when possible", "- If you're not sure about something, acknowledge the uncertainty"]
            
            if context.strip():
                prompt_parts.extend(["\nContext from uploaded documents:", context])
            
            if web_search_results:
                prompt_parts.extend(["\nWeb search results:", web_search_results])
            
            prompt_parts.extend([f"\nQuestion: {question}"])
            
            full_prompt = "\n".join(prompt_parts)

            logger.info("Generating response with AI model")
            result = self.model.generate_content(full_prompt)
            
            if result and result.text:
                logger.info("Successfully generated response from AI model")
                return {
                    "answer": result.text,
                    "assistant_name": self.assistant_config["name"],
                    "assistant_description": self.assistant_config["description"],
                    "model_used": str(self.model),
                    "web_search_used": web_search_results is not None,
                    "success": True
                }
            else:
                logger.warning("AI model returned empty response")
                return self._create_fallback_response(context, question, web_search_results)
                
        except Exception as e:
            logger.error(f"AI generation failed: {str(e)}")
            return self._create_fallback_response(context, question, web_search_results)
    
    def _create_fallback_response(self, context: str, question: str, web_search_results: Optional[str] = None) -> Dict[str, Any]:
        """Create a fallback response when Google API is not available"""
        try:
            assistant_name = self.assistant_config["name"]
            
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
            
            response = f"I'm the {assistant_name}, but I'm currently having trouble processing your request with AI.\n\n"
            
            if relevant_info:
                response += "Here's what I found in your documents:\n\n"
                response += "\n".join(relevant_info)
                response += f"\n\nQuestion asked: {question}"
            else:
                response += f"Question asked: {question}\n\n"
                response += "I couldn't find relevant information in your documents."
            
            if web_search_results:
                response += f"\n\nWeb search results:\n{web_search_results}"
            
            # Provide more helpful information about the issue
            if not self.google_api_available:
                response += f"\n\nNote: The AI service is unavailable because the Google API key is not configured. "
                response += "To fix this, please add your GOOGLE_API_KEY to the .env file in the backend directory. "
                response += "You can get a free API key from https://makersuite.google.com/app/apikey"
            else:
                response += f"\n\nNote: The AI service is temporarily unavailable. Please try again in a few minutes for a more detailed analysis."
            
            return {
                "answer": response,
                "assistant_name": assistant_name,
                "assistant_description": self.assistant_config["description"],
                "web_search_used": web_search_results is not None,
                "fallback_response": True
            }
            
        except Exception as e:
            logger.error(f"Fallback response creation failed: {str(e)}")
            return {
                "answer": f"I'm having trouble processing your request right now. Please try again later.",
                "assistant_name": self.assistant_config["name"],
                "assistant_description": self.assistant_config["description"],
                "web_search_used": web_search_results is not None,
                "fallback_response": True
            }
    
    async def search_web(self, query: str) -> Optional[str]:
        """Search the web for additional information using direct web search API"""
        try:
            if not settings.WEB_SEARCH_ENABLED:
                logger.info("Web search is disabled")
                return None
            
            # Try direct web search API first (DuckDuckGo)
            # This includes improved weather search functionality
            web_content = await self._search_via_api(query)
            if web_content:
                return web_content
            
            # Fallback to MCP server if available
            if settings.MCP_SERVER_ENABLED:
                web_content = await self._search_via_mcp(query)
                if web_content:
                    return web_content
            
            return None
            
        except Exception as e:
            logger.error(f"Web search failed: {str(e)}")
            return None
    
    async def _search_via_mcp(self, query: str) -> Optional[str]:
        """Search via MCP server"""
        try:
            if not settings.MCP_SERVER_ENABLED:
                return None
            
            url = f"{settings.MCP_SERVER_URL}/search"
            headers = {"Content-Type": "application/json"}
            
            if settings.MCP_SERVER_API_KEY:
                headers["Authorization"] = f"Bearer {settings.MCP_SERVER_API_KEY}"
            
            payload = {
                "query": query,
                "max_results": 5,
                "search_engine": "duckduckgo"  # Default to DuckDuckGo
            }
            
            logger.info(f"Searching via MCP server: {query}")
            
            async with asyncio.timeout(10):  # 10 second timeout
                response = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: requests.post(url, json=payload, headers=headers, timeout=10)
                )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("results"):
                    results = data["results"]
                    web_content = "Web search results:\n\n"
                    
                    for i, result in enumerate(results[:5], 1):
                        web_content += f"{i}. {result.get('title', 'No title')}\n"
                        web_content += f"   URL: {result.get('url', 'No URL')}\n"
                        web_content += f"   {result.get('snippet', 'No description')}\n\n"
                    
                    logger.info(f"MCP search successful, found {len(results)} results")
                    return web_content
                else:
                    logger.warning(f"MCP search returned no results: {data}")
                    return None
            else:
                logger.warning(f"MCP search failed with status {response.status_code}: {response.text}")
                return None
                
        except asyncio.TimeoutError:
            logger.error("MCP search timed out")
            return None
        except Exception as e:
            logger.error(f"MCP search error: {str(e)}")
            return None
    
    async def _search_via_api(self, query: str) -> Optional[str]:
        """Search via direct web search API (DuckDuckGo)"""
        try:
            # Use DuckDuckGo Instant Answer API for free web search
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }
            
            logger.info(f"Searching via DuckDuckGo API: {query}")
            
            async with asyncio.timeout(10):  # 10 second timeout
                response = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: requests.get(url, params=params, timeout=10)
                )
            
            if response.status_code == 200:
                data = response.json()
                
                # Build web content from DuckDuckGo results
                web_content = "Web search results:\n\n"
                
                # Add abstract if available
                if data.get("Abstract"):
                    web_content += f"Summary: {data['Abstract']}\n\n"
                
                # Add related topics
                if data.get("RelatedTopics"):
                    web_content += "Related information:\n"
                    for i, topic in enumerate(data["RelatedTopics"][:3], 1):
                        if isinstance(topic, dict) and topic.get("Text"):
                            web_content += f"{i}. {topic['Text']}\n"
                    web_content += "\n"
                
                # Add answer if available
                if data.get("Answer"):
                    web_content += f"Direct answer: {data['Answer']}\n\n"
                
                # Add definition if available
                if data.get("Definition"):
                    web_content += f"Definition: {data['Definition']}\n\n"
                
                # Add weather information if available
                if data.get("AnswerType") == "weather":
                    web_content += f"Weather information: {data.get('Answer', 'Weather data available')}\n\n"
                
                logger.info("DuckDuckGo search successful")
                return web_content if web_content != "Web search results:\n\n" else None
            else:
                logger.warning(f"DuckDuckGo search failed with status {response.status_code}")
                return None
                
        except asyncio.TimeoutError:
            logger.error("DuckDuckGo search timed out")
            return None
        except Exception as e:
            logger.error(f"DuckDuckGo search error: {str(e)}")
            return None

# Keep the old class name for backward compatibility
MultiAgentService = AIService
