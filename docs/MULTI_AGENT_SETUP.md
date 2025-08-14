# Multi-Agent RAG System Setup Guide

This guide explains how to set up and use the new multi-agent RAG system with domain-specific AI assistants and web search functionality.

## 🎯 Features

### Multi-Agent System

- **Domain-Specific AI Assistants**: Specialized models for different domains
  - 🏥 **Health Assistant**: Medical, healthcare, and wellness topics
  - 🌾 **Agriculture Assistant**: Farming, crops, livestock, and agricultural technology
  - ⚖️ **Legal Assistant**: Legal matters, regulations, and compliance
  - 💰 **Finance Assistant**: Financial planning, investments, and economics
  - 📚 **Education Assistant**: Educational content, teaching methods, and learning
  - 🤖 **General Assistant**: General purpose for all topics

### Web Search Integration

- **MCP Server**: Custom web search server with multiple search engines
- **DuckDuckGo Integration**: Free search API (no API key required)
- **Google Custom Search**: Enhanced search with API key
- **Bing Web Search**: Microsoft's search API with API key
- **Automatic Fallback**: Web search when documents don't have enough information

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment variables:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

```bash
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional: For enhanced web search
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_custom_search_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_google_custom_search_engine_id_here
BING_SEARCH_API_KEY=your_bing_search_api_key_here
```

### 2. Start the MCP Web Search Server

```bash
# Make the script executable
chmod +x run-mcp-server.sh

# Start the MCP server
./run-mcp-server.sh
```

The MCP server will run on `http://localhost:3001`

### 3. Start the Backend

```bash
# Start the Python backend
./run-backend.sh
```

### 4. Start the Frontend

```bash
# In a new terminal
cd frontend
npm run dev
```

## 🎛️ Configuration

### Domain-Specific Models

You can configure different AI models for each domain in `.env`:

```bash
# Health domain
HEALTH_MODEL=gemini-1.5-flash

# Agriculture domain
AGRICULTURE_MODEL=gemini-1.5-flash

# Legal domain
LEGAL_MODEL=gemini-1.5-flash

# Finance domain
FINANCE_MODEL=gemini-1.5-flash

# Education domain
EDUCATION_MODEL=gemini-1.5-flash

# General domain
GENERAL_MODEL=gemini-1.5-flash
```

### Web Search Configuration

```bash
# Enable/disable web search
WEB_SEARCH_ENABLED=true

# MCP server settings
MCP_SERVER_ENABLED=true
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_API_KEY=your_api_key_here
```

## 🎯 How to Use

### 1. Domain Selection

Users can manually select a domain or let the AI auto-detect:

- **Manual Selection**: Choose from the domain selector in the settings
- **Auto-Detection**: The AI analyzes the question and context to choose the best domain

### 2. Web Search

Web search is automatically triggered when:

- Documents don't contain enough information to answer the question
- The AI response indicates insufficient information
- Web search is enabled in settings

### 3. Example Usage

#### Health Domain

```
Question: "What are the symptoms of diabetes?"
Domain: Auto-detected as Health
Response: Uses Health Assistant with medical expertise
```

#### Agriculture Domain

```
Question: "How to improve soil fertility for corn farming?"
Domain: Auto-detected as Agriculture
Response: Uses Agriculture Assistant with farming expertise
```

#### With Web Search

```
Question: "Latest developments in quantum computing"
Documents: No relevant documents uploaded
Web Search: Automatically searches the web
Response: Combines web search results with AI analysis
```

## 🔧 API Endpoints

### Multi-Agent Query

```bash
POST /api/query
{
  "question": "Your question here",
  "session_id": "optional_session_id",
  "domain": "health|agriculture|legal|finance|education|general",
  "use_web_search": true
}
```

### Get Available Domains

```bash
GET /api/query/domains
```

### MCP Server Endpoints

```bash
# Health check
GET http://localhost:3001/health

# List search engines
GET http://localhost:3001/engines

# Perform web search
POST http://localhost:3001/search
{
  "query": "search query",
  "max_results": 5,
  "search_engine": "duckduckgo"
}
```

## 🛠️ Customization

### Adding New Domains

1. Edit `backend/app/services/multi_agent_service.py`
2. Add new domain to `AgentDomain` enum
3. Add domain configuration with keywords and system prompt
4. Add model initialization

### Custom Search Engines

1. Edit `backend/mcp_server.py`
2. Add new search method to `WebSearchService`
3. Update the search engine selection logic

### Domain Detection

The system uses keyword matching for domain detection. You can customize:

- Keywords for each domain
- Detection threshold
- Scoring algorithm

## 🔍 Troubleshooting

### MCP Server Issues

```bash
# Check if server is running
curl http://localhost:3001/health

# Check available search engines
curl http://localhost:3001/engines
```

### Domain Detection Issues

- Check the logs for domain detection scores
- Verify keywords are appropriate for your domain
- Adjust detection threshold if needed

### Web Search Issues

- Verify MCP server is running
- Check API keys for Google/Bing search
- Ensure network connectivity

## 📊 Monitoring

### Logs to Watch

- Domain detection scores
- Web search usage
- Model selection
- API response times

### Key Metrics

- Domain detection accuracy
- Web search success rate
- User satisfaction with responses
- API usage by domain

## 🔒 Security Considerations

- API keys should be kept secure
- Web search results should be validated
- User data should be handled according to privacy policies
- Rate limiting should be implemented for web search APIs

## 🚀 Advanced Features

### Custom Models

You can use different AI models for different domains:

- GPT-4 for complex reasoning
- Claude for creative tasks
- Specialized models for specific domains

### Enhanced Web Search

- Multiple search engines for redundancy
- Result filtering and validation
- Caching for repeated queries
- Custom search algorithms

### Domain Training

- Fine-tune models on domain-specific data
- Custom prompts for better responses
- Domain-specific knowledge bases

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [DuckDuckGo Instant Answer API](https://duckduckgo.com/api)
- [Google Custom Search API](https://developers.google.com/custom-search)
- [Bing Web Search API](https://docs.microsoft.com/en-us/bing/search-apis/bing-web-search/)

## 🤝 Contributing

To add new features or improve the system:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
