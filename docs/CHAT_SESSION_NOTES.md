# Chat Session Management Notes

## Overview

This document contains important notes about chat session management in the RAG Next.js application.

## Chat Session Behavior

### Document Upload Timing

- Documents uploaded **before** any chat sessions are available for all future chats
- Documents uploaded **during** a chat session are available for that session and future sessions
- Each chat session maintains its own context and history

### Session Persistence

- Chat sessions are stored in PostgreSQL database
- Messages within sessions are preserved across browser sessions
- Users can switch between different chat sessions
- Sessions can be deleted individually or all at once

### Context Management

- Each chat session has its own document context
- AI responses are based on documents available at the time of the query
- Web search results are session-specific
- Domain-specific AI models are applied per session

## Best Practices

### Document Organization

1. Upload all relevant documents before starting chat sessions
2. Use descriptive filenames for better organization
3. Consider document order for context relevance
4. Review and clean up old documents periodically

### Chat Session Management

1. Create separate sessions for different topics
2. Use clear session titles for easy identification
3. Export important conversations before deletion
4. Regularly clear old sessions to maintain performance

### Performance Considerations

- Large document collections may slow down search
- Many active sessions can impact memory usage
- Regular cleanup of old sessions is recommended
- Monitor database size and performance

## Technical Notes

### Database Schema

- Chat sessions are stored in `chat_sessions` table
- Messages are stored in `messages` table with session references
- Documents are stored in `documents` table
- Vector embeddings are stored in Qdrant

### API Endpoints

- `GET /api/chat` - Retrieve all chat sessions
- `POST /api/chat` - Create new chat session
- `DELETE /api/chat?sessionId=<id>` - Delete specific session
- `GET /api/messages?sessionId=<id>` - Get messages for session

### Error Handling

- Failed chat sessions are logged for debugging
- Document processing errors don't affect existing sessions
- Network issues are handled gracefully with retry mechanisms
- User is notified of any session-related errors

---

**Note**: This document was originally created as a placeholder and has been updated with comprehensive chat session management information.
