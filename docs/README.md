# RAG Next.js Documentation

Welcome to the RAG Next.js application documentation. This folder contains detailed guides and setup instructions for different components of the application.

## 📚 Documentation Index

### 🚀 Getting Started

- **[Main README](../README.md)** - Complete project overview and quick start guide
- **[Python Backend Setup](SETUP_PYTHON_BACKEND.md)** - Detailed backend installation and configuration
- **[User Authentication Setup](USER_AUTHENTICATION_SETUP.md)** - Google OAuth configuration guide
- **[Multi-Agent Setup](MULTI_AGENT_SETUP.md)** - Domain-specific AI agent configuration
- **[Chat Session Notes](CHAT_SESSION_NOTES.md)** - Chat session management and best practices
- **[Database Setup Script](setup-db.js)** - PostgreSQL database initialization script

## 🏗️ Architecture Overview

The RAG Next.js application is built with a modern microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   External      │
│   Frontend      │◄──►│   Backend       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React         │    │ • Gemini AI     │    │ • Hugging Face  │
│ • TypeScript    │    │ • Qdrant        │    │ • DuckDuckGo    │
│ • Tailwind CSS  │    │ • PostgreSQL    │    │ • Google OAuth  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Core Technologies

### AI & Machine Learning

- **Google Gemini 1.5 Flash** - Primary AI generation model
- **all-MiniLM-L6-v2** - Text embeddings via Hugging Face API
- **Multi-domain AI** - Specialized models for different domains

### Data Storage

- **PostgreSQL** - Primary database for documents and chat sessions
- **Qdrant** - Vector database for semantic similarity search
- **File System** - Document storage and processing

### Web & Search

- **DuckDuckGo** - Web search integration
- **Hybrid Search** - Combine document and web search
- **Real-time Updates** - Live search results

### Authentication & Security

- **Google OAuth** - Secure user authentication
- **JWT Tokens** - Session management
- **CORS Protection** - Cross-origin request security

## 📋 Setup Checklists

### Backend Setup Checklist

- [ ] Install Python 3.9+
- [ ] Install Poetry for dependency management
- [ ] Configure PostgreSQL database
- [ ] Set up Qdrant vector database
- [ ] Configure Google Gemini API key
- [ ] Set up Google OAuth credentials
- [ ] Configure environment variables
- [ ] Test all services

### Frontend Setup Checklist

- [ ] Install Node.js 18+
- [ ] Install project dependencies
- [ ] Configure environment variables
- [ ] Set up Google OAuth redirect URIs
- [ ] Test authentication flow
- [ ] Verify API connectivity

### Production Deployment Checklist

- [ ] Set up production database
- [ ] Configure production environment variables
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Test all functionality in production

## 🔍 API Reference

### Authentication Endpoints

- `POST /api/auth` - Login/logout operations
- `GET /api/auth?action=me` - Get current user information

### Chat Endpoints

- `POST /api/chat` - Send chat message
- `GET /api/messages` - Retrieve chat history
- `POST /api/clear-all` - Clear all chat sessions

### Document Endpoints

- `POST /api/documents` - Upload documents
- `GET /api/documents` - List all documents
- `DELETE /api/documents` - Delete documents

### Query Endpoints

- `POST /api/query` - Query documents and web
- `GET /api/query/domains` - Get available AI domains

## 🛠️ Development Guide

### Code Structure

```
backend/
├── app/
│   ├── api/routes/     # API endpoints
│   ├── core/           # Configuration and database
│   ├── models/         # Database models
│   ├── services/       # Business logic
│   └── utils/          # Utility functions

frontend/
├── src/
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   └── lib/            # Utilities and API
```

### Development Workflow

1. **Backend Development**

   - Use Poetry for dependency management
   - Follow FastAPI best practices
   - Implement proper error handling
   - Add comprehensive logging

2. **Frontend Development**

   - Use TypeScript for type safety
   - Follow React best practices
   - Implement responsive design
   - Add proper error boundaries

3. **Testing**
   - Write unit tests for backend services
   - Test API endpoints
   - Test frontend components
   - Perform integration testing

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues

- **Database Connection**: Check PostgreSQL is running and credentials are correct
- **Qdrant Connection**: Verify Qdrant is accessible on configured port
- **Gemini API**: Ensure API key is valid and has proper permissions
- **OAuth Issues**: Check redirect URIs and client credentials

#### Frontend Issues

- **Authentication**: Verify OAuth configuration and redirect URIs
- **API Calls**: Check CORS configuration and API endpoints
- **Build Errors**: Ensure all dependencies are installed
- **Runtime Errors**: Check browser console for detailed error messages

#### Performance Issues

- **Slow Responses**: Check AI API rate limits and database performance
- **Memory Usage**: Monitor vector database memory consumption
- **File Upload**: Verify file size limits and processing efficiency

### Debug Mode

Enable debug logging by setting environment variables:

```bash
LOG_LEVEL=DEBUG
DEBUG=true
```

## 📊 Monitoring & Logging

### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General application information
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error messages for failed operations
- **CRITICAL**: Critical errors that require immediate attention

### Key Metrics to Monitor

- API response times
- Database query performance
- AI service availability
- User authentication success rates
- File upload success rates
- Vector search performance

## 🔒 Security Considerations

### Data Protection

- All user data is encrypted at rest
- API keys are stored securely in environment variables
- JWT tokens have appropriate expiration times
- CORS is configured to prevent unauthorized access

### Authentication Security

- Google OAuth provides secure authentication
- Session tokens are validated on each request
- Password hashing is handled by Google OAuth
- Account lockout mechanisms are in place

### API Security

- Rate limiting is implemented
- Input validation prevents injection attacks
- Error messages don't expose sensitive information
- HTTPS is required in production

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks

- Update dependencies regularly
- Monitor API rate limits
- Backup database regularly
- Review and rotate API keys
- Monitor system performance

### Version Updates

- Test updates in development environment
- Follow semantic versioning
- Maintain backward compatibility
- Update documentation with changes

## 📞 Support

For additional support:

- Check the main [README](../README.md) for quick start information
- Review the specific setup guides in this folder
- Open an issue on the project repository
- Check the troubleshooting section above

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
