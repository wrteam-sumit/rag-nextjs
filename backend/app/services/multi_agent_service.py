import google.generativeai as genai
from app.core.config import settings
import logging
from typing import List, Dict, Any, Optional
import requests
import json
import asyncio
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)

class AgentDomain(Enum):
    """Enum for different agent domains"""
    GENERAL = "general"
    HEALTH = "health"
    AGRICULTURE = "agriculture"
    LEGAL = "legal"
    FINANCE = "finance"
    EDUCATION = "education"

class MultiAgentService:
    """Service for managing multiple domain-specific AI agents"""
    
    def __init__(self):
        # Initialize Google Gemini
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # Initialize domain-specific models
        self.models = {
            AgentDomain.GENERAL: genai.GenerativeModel(settings.GENERAL_MODEL),
            AgentDomain.HEALTH: genai.GenerativeModel(settings.HEALTH_MODEL),
            AgentDomain.AGRICULTURE: genai.GenerativeModel(settings.AGRICULTURE_MODEL),
            AgentDomain.LEGAL: genai.GenerativeModel(settings.LEGAL_MODEL),
            AgentDomain.FINANCE: genai.GenerativeModel(settings.FINANCE_MODEL),
            AgentDomain.EDUCATION: genai.GenerativeModel(settings.EDUCATION_MODEL),
        }
        
        # Domain-specific prompts and configurations
        self.domain_configs = {
            AgentDomain.HEALTH: {
                "name": "Health Assistant",
                "description": "Specialized in medical, healthcare, and wellness topics",
                "system_prompt": """You are a specialized Health AI Assistant with expertise in medical, healthcare, and wellness topics. 
                You provide accurate, evidence-based information while always reminding users to consult healthcare professionals for medical advice.
                Focus on general health information, wellness tips, and educational content about health topics.""",
                "keywords": ["health", "medical", "doctor", "patient", "treatment", "symptoms", "medicine", "wellness", "fitness", "nutrition", "disease", "therapy", "hospital", "clinic", "pharmacy", "vaccine", "diagnosis", "prescription", "surgery", "recovery", "diabetes", "cancer", "heart", "blood", "pain", "fever", "cough", "headache", "stomach", "chest", "back", "joint", "muscle", "bone", "skin", "eye", "ear", "nose", "throat", "lung", "liver", "kidney", "brain", "mental", "anxiety", "depression", "stress", "sleep", "exercise", "diet", "vitamin", "protein", "fat", "carbohydrate", "calorie", "weight", "obesity", "hypertension", "cholesterol", "blood pressure", "heart attack", "stroke", "tumor", "infection", "bacteria", "virus", "fungus", "parasite", "allergy", "asthma", "arthritis", "thyroid", "hormone", "pregnancy", "birth", "child", "baby", "elderly", "aging", "death", "mortality", "life expectancy", "quality of life", "prevention", "screening", "early detection", "cure", "healing", "rehabilitation", "physical therapy", "occupational therapy", "speech therapy", "psychotherapy", "counseling", "meditation", "yoga", "acupuncture", "chiropractic", "homeopathy", "herbal", "natural", "alternative", "complementary", "traditional", "western", "eastern", "holistic", "integrated", "personalized", "precision", "genomic", "genetic", "molecular", "cellular", "tissue", "organ", "system", "physiology", "anatomy", "pathology", "pharmacology", "toxicology", "epidemiology", "biostatistics", "clinical trial", "research", "evidence", "guideline", "protocol", "standard", "best practice", "quality", "safety", "efficacy", "effectiveness", "outcome", "prognosis", "morbidity", "survival", "remission", "relapse", "recurrence", "metastasis", "progression", "staging", "grading", "classification", "differential", "rule out", "confirm", "verify", "test", "laboratory", "imaging", "x-ray", "ct", "mri", "ultrasound", "endoscopy", "biopsy", "operation", "procedure", "intervention", "medication", "drug", "dosage", "side effect", "adverse", "complication", "risk", "benefit", "cost", "insurance", "coverage", "reimbursement", "payment", "billing", "coding", "documentation", "record", "chart", "note", "report", "consultation", "referral", "follow-up", "monitoring", "surveillance", "immunization", "booster", "shot", "injection", "oral", "topical", "intravenous", "intramuscular", "subcutaneous", "intradermal", "transdermal", "inhalation", "nasal", "rectal", "vaginal", "urethral", "intraocular", "intrathecal", "intraperitoneal", "intrapleural", "intraarticular", "intralesional", "intracardiac", "intracerebral", "intraspinal", "intraosseous", "intrauterine", "intraamniotic", "intraplacental", "intrafetal", "intraembryonic", "intraovarian", "intratesticular", "intraprostatic", "intravesical", "intraurethral", "intravaginal", "intrarectal", "intraanal", "intraoral", "intranasal", "intraauricular", "intraocular", "intracranial", "intracerebral", "intraventricular", "intracisternal", "intraspinal", "intradural", "intraepidural", "intrasubarachnoid", "intracerebroventricular", "intracisternal", "intraventricular", "intracerebral", "intracranial", "intraocular", "intraauricular", "intranasal", "intraoral", "intraanal", "intrarectal", "intravaginal", "intraurethral", "intravesical", "intraprostatic", "intratesticular", "intraovarian", "intraembryonic", "intrafetal", "intraplacental", "intraamniotic", "intrauterine", "intraosseous", "intraspinal", "intracerebral", "intracardiac", "intralesional", "intraarticular", "intrapleural", "intraperitoneal", "intrathecal", "intraocular", "transdermal", "intradermal", "subcutaneous", "intramuscular", "intravenous", "topical", "oral", "injection", "shot", "booster", "immunization", "vaccination", "prevention", "screening", "surveillance", "monitoring", "follow-up", "referral", "consultation", "report", "note", "chart", "record", "documentation", "coding", "billing", "payment", "reimbursement", "coverage", "insurance", "cost", "benefit", "risk", "complication", "adverse", "side effect", "dosage", "prescription", "drug", "medication", "therapy", "treatment", "intervention", "procedure", "operation", "surgery", "biopsy", "endoscopy", "ultrasound", "mri", "ct", "x-ray", "imaging", "laboratory", "test", "verify", "confirm", "rule out", "differential", "diagnosis", "classification", "grading", "staging", "progression", "metastasis", "recurrence", "relapse", "remission", "survival", "mortality", "morbidity", "outcome", "effectiveness", "efficacy", "safety", "quality", "best practice", "protocol", "guideline", "evidence", "research", "clinical trial", "biostatistics", "epidemiology", "toxicology", "pharmacology", "pathology", "anatomy", "physiology", "system", "organ", "tissue", "cellular", "molecular", "genetic", "genomic", "precision", "personalized", "integrated", "holistic", "eastern", "western", "traditional", "complementary", "alternative", "natural", "herbal", "homeopathy", "chiropractic", "acupuncture", "yoga", "meditation", "counseling", "psychotherapy", "speech therapy", "occupational therapy", "physical therapy", "rehabilitation", "healing", "cure", "early detection", "screening", "prevention", "quality of life", "life expectancy", "mortality", "death", "aging", "elderly", "baby", "child", "birth", "pregnancy", "hormone", "thyroid", "diabetes", "arthritis", "asthma", "allergy", "parasite", "fungus", "virus", "bacteria", "infection", "tumor", "cancer", "stroke", "heart attack", "blood pressure", "cholesterol", "obesity", "weight", "calorie", "carbohydrate", "fat", "protein", "vitamin", "diet", "exercise", "sleep", "stress", "depression", "anxiety", "mental", "brain", "kidney", "liver", "lung", "throat", "nose", "ear", "eye", "skin", "bone", "muscle", "joint", "back", "chest", "stomach", "headache", "cough", "fever", "pain", "blood", "heart", "cancer", "diabetes"]
            },
            AgentDomain.AGRICULTURE: {
                "name": "Agriculture Assistant", 
                "description": "Specialized in farming, crops, livestock, and agricultural technology",
                "system_prompt": """You are a specialized Agriculture AI Assistant with expertise in farming, crops, livestock, agricultural technology, and sustainable farming practices.
                You provide practical advice on crop management, soil health, pest control, livestock care, and modern agricultural techniques.
                Focus on sustainable and efficient farming practices.""",
                "keywords": ["agriculture", "farming", "crops", "livestock", "soil", "fertilizer", "pesticide", "harvest", "irrigation", "tractor", "greenhouse", "organic", "sustainable", "cattle", "poultry", "dairy", "grain", "vegetables", "fruits", "farm", "farmer"]
            },
            AgentDomain.LEGAL: {
                "name": "Legal Assistant",
                "description": "Specialized in legal matters, regulations, and compliance",
                "system_prompt": """You are a specialized Legal AI Assistant with expertise in legal matters, regulations, compliance, and general legal information.
                You provide educational legal information while always reminding users to consult qualified legal professionals for specific legal advice.
                Focus on general legal concepts, regulatory information, and legal education.""",
                "keywords": ["legal", "law", "attorney", "lawyer", "court", "contract", "regulation", "compliance", "litigation", "jurisdiction", "statute", "case law", "legal advice", "legal document", "legal rights", "legal obligation", "legal procedure", "legal system", "legal precedent", "legal counsel"]
            },
            AgentDomain.FINANCE: {
                "name": "Finance Assistant",
                "description": "Specialized in financial planning, investments, and economic topics",
                "system_prompt": """You are a specialized Finance AI Assistant with expertise in financial planning, investments, economics, and personal finance.
                You provide educational financial information while always reminding users to consult qualified financial advisors for personalized financial advice.
                Focus on general financial concepts, investment education, and financial planning principles.""",
                "keywords": ["finance", "financial", "investment", "money", "banking", "stock", "bond", "mutual fund", "retirement", "tax", "budget", "savings", "loan", "credit", "mortgage", "insurance", "portfolio", "dividend", "interest", "capital", "revenue", "profit", "loss", "asset", "liability"]
            },
            AgentDomain.EDUCATION: {
                "name": "Education Assistant",
                "description": "Specialized in educational content, teaching methods, and learning strategies",
                "system_prompt": """You are a specialized Education AI Assistant with expertise in educational content, teaching methods, learning strategies, and academic topics.
                You provide educational support, explain complex concepts, and help with learning strategies.
                Focus on effective teaching methods, learning techniques, and educational content delivery.""",
                "keywords": ["education", "teaching", "learning", "student", "teacher", "school", "university", "college", "course", "curriculum", "lesson", "assignment", "homework", "study", "exam", "test", "grade", "academic", "scholarship", "degree", "diploma", "certificate", "tutorial", "lecture", "seminar", "workshop"]
            },
            AgentDomain.GENERAL: {
                "name": "General Assistant",
                "description": "General purpose AI assistant for all topics",
                "system_prompt": """You are a helpful AI assistant that answers questions based on the provided document context.
                You provide accurate, helpful information across all topics while being clear about your limitations.""",
                "keywords": []
            }
        }
        
        logger.info("Multi-agent service initialized with domain-specific models")
    
    def detect_domain(self, question: str, context: str = "") -> AgentDomain:
        """Detect the most appropriate domain for a given question"""
        try:
            # Combine question and context for better domain detection
            text = f"{question} {context}".lower()
            
            # Score each domain based on keyword matches
            domain_scores = {}
            
            for domain, config in self.domain_configs.items():
                if domain == AgentDomain.GENERAL:
                    continue  # Skip general domain for scoring
                
                score = 0
                keywords = config.get("keywords", [])
                
                for keyword in keywords:
                    if keyword in text:
                        score += 1
                
                # Normalize score by number of keywords
                if keywords:
                    score = score / len(keywords)
                
                domain_scores[domain] = score
            
            # Find domain with highest score
            if domain_scores:
                best_domain = max(domain_scores.items(), key=lambda x: x[1])
                if best_domain[1] > 0.02:  # Lower threshold for domain detection (2% match)
                    logger.info(f"Detected domain: {best_domain[0].value} (score: {best_domain[1]:.3f})")
                    return best_domain[0]
            
            # Default to general if no strong domain match
            logger.info("No specific domain detected, using general assistant")
            return AgentDomain.GENERAL
            
        except Exception as e:
            logger.error(f"Domain detection failed: {str(e)}")
            return AgentDomain.GENERAL
    
    async def generate_response(self, question: str, context: str, domain: Optional[AgentDomain] = None) -> Dict[str, Any]:
        """Generate response using the appropriate domain-specific model"""
        try:
            # Auto-detect domain if not provided
            if domain is None:
                domain = self.detect_domain(question, context)
            
            # Get domain configuration
            domain_config = self.domain_configs[domain]
            model = self.models[domain]
            
            # Build domain-specific prompt
            system_prompt = domain_config["system_prompt"]
            
            # Limit context size to avoid API limits
            max_context_length = 15000
            if len(context) > max_context_length:
                context = context[:max_context_length] + "\n\n[Content truncated due to size limits...]"
            
            prompt = f"""{system_prompt}

Instructions:
- Answer based ONLY on the information provided in the context
- If the context doesn't contain enough information to answer the question, say so
- Be concise but thorough
- Cite which document the information comes from when possible
- If you're not sure about something, acknowledge the uncertainty
- Always provide helpful, accurate information within your domain expertise

Context from uploaded documents:

{context}

Question: {question}"""

            logger.info(f"Generating response with {domain.value} model")
            result = model.generate_content(prompt)
            
            if result and result.text:
                logger.info(f"Successfully generated response from {domain.value} model")
                return {
                    "answer": result.text,
                    "domain": domain.value,
                    "domain_name": domain_config["name"],
                    "domain_description": domain_config["description"],
                    "model_used": str(model),
                    "success": True
                }
            else:
                logger.warning(f"{domain.value} model returned empty response")
                return self._create_fallback_response(context, question, domain)
                
        except Exception as e:
            logger.error(f"AI generation failed for {domain.value}: {str(e)}")
            return self._create_fallback_response(context, question, domain)
    
    def _create_fallback_response(self, context: str, question: str, domain: AgentDomain) -> Dict[str, Any]:
        """Create a fallback response when AI generation fails"""
        try:
            domain_config = self.domain_configs[domain]
            
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
            
            response = f"I found relevant documents but I'm having trouble processing them with the {domain_config['name']} right now. Here's what I found:\n\n"
            response += "\n".join(relevant_info)
            response += f"\n\nQuestion asked: {question}"
            response += f"\n\nNote: The {domain_config['name']} is temporarily unavailable. Please try again in a few minutes for a more detailed analysis."
            
            return {
                "answer": response,
                "domain": domain.value,
                "domain_name": domain_config["name"],
                "domain_description": domain_config["description"],
                "model_used": "fallback",
                "success": False,
                "error": "AI generation failed"
            }
            
        except Exception as e:
            logger.error(f"Fallback response creation failed: {str(e)}")
            return {
                "answer": f"I found relevant documents but I'm having trouble processing them right now. Please try again later.",
                "domain": domain.value,
                "domain_name": "Unknown",
                "domain_description": "Unknown",
                "model_used": "fallback",
                "success": False,
                "error": str(e)
            }
    
    async def search_web(self, query: str) -> Optional[str]:
        """Search the web for additional information using direct web search API"""
        try:
            if not settings.WEB_SEARCH_ENABLED:
                logger.info("Web search is disabled")
                return None
            
            # Try direct web search API first (DuckDuckGo)
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
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.MCP_SERVER_API_KEY}" if settings.MCP_SERVER_API_KEY else ""
            }
            
            payload = {
                "query": query,
                "max_results": 5
            }
            
            response = requests.post(
                f"{settings.MCP_SERVER_URL}/search",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results"):
                    # Combine search results
                    results = []
                    for result in data["results"]:
                        title = result.get("title", "")
                        snippet = result.get("snippet", "")
                        url = result.get("url", "")
                        results.append(f"Title: {title}\nContent: {snippet}\nSource: {url}")
                    
                    web_content = "\n\n---\n\n".join(results)
                    logger.info(f"Retrieved {len(data['results'])} web search results via MCP")
                    return web_content
            
            logger.warning(f"MCP search failed: {response.status_code}")
            return None
            
        except Exception as e:
            logger.error(f"MCP search error: {str(e)}")
            return None
    
    async def _search_via_api(self, query: str) -> Optional[str]:
        """Search via web APIs for current information"""
        try:
            import requests
            import json
            from datetime import datetime
            from urllib.parse import quote_plus
            import xml.etree.ElementTree as ET
            
            query_lower = query.lower()
            
            # Check if it's a weather query
            if any(word in query_lower for word in ['weather', 'temperature', 'forecast', 'climate']):
                # For weather queries, provide current weather information
                weather_info = self._get_weather_info(query)
                if weather_info:
                    return weather_info

            # Check if it's a location query
            if any(phrase in query_lower for phrase in [
                'where am i', 'my location', 'current location', 'near me', 'what is my location', 'location'
            ]):
                location_info = self._get_location_info()
                if location_info:
                    return location_info

            # Check if it's a news query
            if any(word in query_lower for word in ['news', 'headline', 'headlines', 'trending', 'breaking']):
                news_info = self._get_news_info(query)
                if news_info:
                    return news_info
            
            # For other queries, try to provide relevant current information
            # General web search (titles/snippets/links + optional page extraction)
            general_info = self._search_general_info(query)
            if general_info:
                return general_info

            # Fallback informational stub if nothing else worked
            current_info = self._get_current_info(query)
            if current_info:
                return current_info
            
            logger.info("No relevant current information found")
            return None
                
        except Exception as e:
            logger.error(f"Web search error: {str(e)}")
            return None
    
    def _search_general_info(self, query: str, max_results: int = 5, fetch_pages: int = 2) -> Optional[str]:
        """General-purpose web search using DuckDuckGo results and optional lightweight page extraction.

        - Fetches top results (title/snippet/link) via duckduckgo_search (no API key).
        - Optionally fetches first N pages and extracts main text using trafilatura.
        - Returns a stitched text block suitable as model context.
        """
        try:
            # Import inside function so the app still runs if deps are missing
            try:
                from duckduckgo_search import DDGS  # type: ignore
            except Exception as e:
                logger.warning(f"duckduckgo_search not available: {e}")
                return None

            results: List[Dict[str, Any]] = []
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results, region="wt-wt", safesearch="moderate"):
                    # r keys typically: title, href, body
                    results.append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", "")
                    })

            if not results:
                logger.info("duckduckgo_search returned no results")
                return None

            # Try to fetch content of first few results to enrich context
            extracted_blocks: List[str] = []
            try:
                import trafilatura  # type: ignore
                import requests
                headers = {
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/115.0 Safari/537.36"
                    )
                }
                for i, res in enumerate(results[:max(fetch_pages, 0)]):
                    url = res.get("url")
                    if not url:
                        continue
                    try:
                        resp = requests.get(url, headers=headers, timeout=10)
                        if resp.ok:
                            extracted = trafilatura.extract(resp.text, url=url, include_links=False)
                            if extracted and len(extracted) > 200:
                                extracted_blocks.append(
                                    f"[Extracted from: {url}]\n{extracted[:3000]}"
                                )
                    except Exception:
                        continue
            except Exception as e:
                logger.info(f"Page extraction unavailable or failed gracefully: {e}")

            # Build stitched web content
            lines: List[str] = ["Title: Web Search Results"]
            for res in results:
                title = res.get("title", "").strip()
                snippet = res.get("snippet", "").strip()
                url = res.get("url", "").strip()
                if title or snippet or url:
                    lines.append(f"Title: {title}\nContent: {snippet}\nSource: {url}")

            # Append extracted page content if available
            if extracted_blocks:
                lines.append("\n---\n\nDetailed Content Extracts:")
                lines.extend(extracted_blocks)

            web_content = "\n\n---\n\n".join(lines)
            logger.info(f"General web search compiled {len(results)} results; extracts: {len(extracted_blocks)}")
            return web_content
        except Exception as e:
            logger.error(f"General web search error: {str(e)}")
            return None

    def _get_weather_info(self, query: str) -> Optional[str]:
        """Get current weather information"""
        try:
            # For demonstration, provide current weather information
            # In a real implementation, you would use a weather API like OpenWeatherMap
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            weather_info = f"""Title: Current Weather Information
Content: Based on your query about weather, here is current weather information:

Current Date and Time: {current_time}

Weather Summary:
- Temperature: 72°F (22°C)
- Conditions: Partly Cloudy
- Humidity: 65%
- Wind: 8 mph from West
- Visibility: 10 miles

Today's Forecast:
- Morning: 68°F, Sunny
- Afternoon: 75°F, Partly Cloudy
- Evening: 70°F, Clear

Note: This is sample weather data. For accurate real-time weather information, please check a local weather service or weather app.

Source: Weather Information Service
"""
            return weather_info
            
        except Exception as e:
            logger.error(f"Weather info error: {str(e)}")
            return None
    
    def _get_location_info(self) -> Optional[str]:
        """Get approximate location based on server IP (demo)."""
        try:
            import requests
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            # Try ipapi.co
            try:
                r = requests.get("https://ipapi.co/json/", timeout=8)
                if r.ok:
                    data = r.json()
                    city = data.get('city', 'Unknown')
                    region = data.get('region', 'Unknown')
                    country = data.get('country_name', data.get('country', 'Unknown'))
                    lat = data.get('latitude', data.get('lat', ''))
                    lon = data.get('longitude', data.get('lon', ''))
                    ip = data.get('ip', '')
                    org = data.get('org', '')
                    return f"""Title: Approximate Location (IP-based)
Content: Here is the approximate location based on the server's IP (demo):

Timestamp: {current_time}
IP: {ip}
City/Region/Country: {city}, {region}, {country}
Coordinates: {lat}, {lon}
Network: {org}

Note: This uses server IP, not the end-user's precise device location. For accurate user location, enable browser geolocation and pass coordinates to the backend.

Source: ipapi.co
"""
            except Exception:
                pass

            # Fallback ip-api.com
            r = requests.get("http://ip-api.com/json", timeout=8)
            if r.ok:
                data = r.json()
                city = data.get('city', 'Unknown')
                region = data.get('regionName', 'Unknown')
                country = data.get('country', 'Unknown')
                lat = data.get('lat', '')
                lon = data.get('lon', '')
                ip = data.get('query', '')
                isp = data.get('isp', '')
                return f"""Title: Approximate Location (IP-based)
Content: Here is the approximate location based on the server's IP (demo):

Timestamp: {current_time}
IP: {ip}
City/Region/Country: {city}, {region}, {country}
Coordinates: {lat}, {lon}
ISP: {isp}

Note: This uses server IP, not the end-user's precise device location. For accurate user location, enable browser geolocation and pass coordinates to the backend.

Source: ip-api.com
"""
            return None
        except Exception as e:
            logger.error(f"Location info error: {str(e)}")
            return None

    def _get_news_info(self, query: str) -> Optional[str]:
        """Get trending or query-specific news using Google News RSS (no API key)."""
        try:
            import requests
            import xml.etree.ElementTree as ET
            from urllib.parse import quote_plus

            # If query mentions a topic after 'news', try search RSS; else general top stories
            q_lower = query.lower().strip()
            if 'news' in q_lower and len(q_lower) > 4:
                rss_url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-US&gl=US&ceid=US:en"
            else:
                rss_url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

            resp = requests.get(rss_url, timeout=10)
            if not resp.ok:
                logger.warning(f"News RSS fetch failed: {resp.status_code}")
                return None

            root = ET.fromstring(resp.text)
            channel = root.find('channel')
            if channel is None:
                return None

            items = channel.findall('item')[:5]
            if not items:
                return None

            parts = ["Title: Top/Trending News"]
            for i, item in enumerate(items, start=1):
                title_el = item.find('title')
                link_el = item.find('link')
                pub_el = item.find('pubDate')
                title = title_el.text if title_el is not None else 'Untitled'
                link = link_el.text if link_el is not None else ''
                pub = pub_el.text if pub_el is not None else ''
                parts.append(f"{i}. {title}\nSource: {link}\nPublished: {pub}")

            return "\n\n---\n\n".join(parts)
        except Exception as e:
            logger.error(f"News info error: {str(e)}")
            return None

    def _get_current_info(self, query: str) -> Optional[str]:
        """Get current information for other types of queries"""
        try:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Provide general current information
            info = f"""Title: Current Information
Content: Based on your query "{query}", here is current information:

Current Date and Time: {current_time}

General Information:
- This is a demonstration of web search functionality
- For real-time information, please check reliable sources
- The system is designed to provide helpful responses based on available context

Note: This response is generated to demonstrate the web search feature. For accurate and up-to-date information, please consult official sources or search engines.

Source: Information Service
"""
            return info
            
        except Exception as e:
            logger.error(f"Current info error: {str(e)}")
            return None
    
    def get_available_domains(self) -> List[Dict[str, str]]:
        """Get list of available domains and their descriptions"""
        domains = []
        for domain, config in self.domain_configs.items():
            domains.append({
                "id": domain.value,
                "name": config["name"],
                "description": config["description"]
            })
        return domains
    
    async def generate_response_with_web_search(self, question: str, context: str, domain: Optional[AgentDomain] = None) -> Dict[str, Any]:
        """Generate response with web search fallback if context is insufficient"""
        try:
            # Check if this is a web-search-only scenario (no document context)
            is_web_search_only = context.strip() == "No relevant documents found. Using web search for information."
            
            if is_web_search_only:
                logger.info("🔍 Web-search-only scenario detected, searching web directly")
                web_content = await self.search_web(question)
                
                if web_content:
                    # Generate response using only web content
                    web_result = await self.generate_response(question, web_content, domain)
                    web_result["web_search_used"] = True
                    web_result["search_method"] = "web_search_only"
                    logger.info("Generated response using web search only")
                    return web_result
                else:
                    logger.warning("Web search returned no results")
                    return await self.generate_response(question, "No information found from documents or web search.", domain)
            
            # Normal flow: try with document context first
            result = await self.generate_response(question, context, domain)
            
            # Check if the response indicates insufficient information
            insufficient_keywords = [
                "doesn't contain enough information",
                "not enough information",
                "no information found",
                "cannot answer",
                "unable to answer",
                "don't have enough information",
                "cannot be answered from the given source",
                "does not contain information",
                "doesn't contain information",
                "no information about",
                "does not have information",
                "doesn't have information",
                "cannot provide information",
                "unable to provide information"
            ]
            
            response_lower = result["answer"].lower()
            has_insufficient_info = any(keyword in response_lower for keyword in insufficient_keywords)
            
            logger.info(f"🔍 Checking web search trigger - Response: {result['answer'][:100]}...")
            logger.info(f"🔍 Has insufficient info: {has_insufficient_info}")
            logger.info(f"🔍 Web search enabled: {settings.WEB_SEARCH_ENABLED}")
            
            # If insufficient information and web search is enabled, try web search
            if has_insufficient_info and settings.WEB_SEARCH_ENABLED:
                logger.info("Context insufficient, attempting web search")
                web_content = await self.search_web(question)
                
                if web_content:
                    # Combine context with web content
                    combined_context = f"{context}\n\n--- Web Search Results ---\n{web_content}"
                    
                    # Generate new response with combined context
                    web_result = await self.generate_response(question, combined_context, domain)
                    
                    # Update the result to indicate web search was used
                    web_result["web_search_used"] = True
                    web_result["original_response"] = result["answer"]
                    
                    logger.info("Generated response with web search augmentation")
                    return web_result
                else:
                    logger.info("Web search returned no results")
            else:
                logger.info("Web search not triggered - sufficient info or disabled")
            
            # Return original result
            result["web_search_used"] = False
            return result
            
        except Exception as e:
            logger.error(f"Response generation with web search failed: {str(e)}")
            return await self.generate_response(question, context, domain)
