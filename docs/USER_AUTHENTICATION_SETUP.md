# User Authentication & User-Specific Data Setup

## Overview

The application has been updated to require user authentication and make all data user-specific. This means:

- **Authentication Required**: Users must be logged in to access any features
- **User-Specific Data**: All documents, chats, and messages are tied to the authenticated user
- **Secure Access**: Users can only access their own data
- **Google OAuth**: Authentication is handled through Google OAuth2

## What Changed

### Backend Changes

1. **Database Schema Updates**:

   - Added `user_id` foreign key columns to `documents`, `chat_sessions`, and `messages` tables
   - Added relationships between `User` and other tables
   - Added cascade delete for user data

2. **Authentication System**:

   - Created `app/core/auth.py` with authentication dependencies
   - Added `get_current_user()` dependency for protected endpoints
   - Added `get_optional_user()` for optional authentication

3. **API Route Updates**:

   - All endpoints now require authentication via `get_current_user` dependency
   - All queries filter by `user_id` to ensure data isolation
   - Vector search includes user filtering

4. **Vector Service Updates**:
   - Added `search_documents_with_user_filter()` method
   - Added `clear_user_documents()` method
   - User ID included in document metadata

### Frontend Changes

1. **Authentication Wrapper**:

   - Created `AuthWrapper` component that checks authentication
   - Redirects unauthenticated users to login page
   - Shows loading state during authentication check

2. **Protected Routes**:
   - Main application wrapped in `AuthWrapper`
   - Login page shown for unauthenticated users
   - User information displayed in header

## Setup Instructions

### 1. Run Database Migration

```bash
# Make the migration script executable
chmod +x run-migration.sh

# Run the migration
./run-migration.sh
```

This will:

- Add `user_id` columns to existing tables
- Create foreign key constraints
- Check for existing data

### 2. Handle Existing Data (Optional)

If you have existing data and want to preserve it:

```bash
cd backend
python migrate_user_schema.py --create-default-user
```

This creates a default user and assigns all existing data to them.

### 3. Restart Services

```bash
# Stop all services
./stop-all.sh

# Start all services
./start-all.sh
```

### 4. Test Authentication

1. Visit the application
2. You should be redirected to a login page
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Verify you can access the application

## API Changes

### Protected Endpoints

All endpoints now require authentication. The JWT token is sent via:

- **Cookies**: `auth_token` (for web requests)
- **Headers**: `Authorization: Bearer <token>` (for API requests)

### New Authentication Endpoints

- `GET /api/auth/google/login` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Handle OAuth callback
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Updated Endpoints

All existing endpoints now:

- Require authentication
- Filter data by user ID
- Return only user-specific data

## Security Features

1. **Data Isolation**: Users can only access their own data
2. **JWT Tokens**: Secure token-based authentication
3. **CORS Protection**: Proper CORS configuration
4. **Input Validation**: All inputs validated and sanitized
5. **Error Handling**: Secure error messages

## Testing

### Test Authentication Flow

1. **Unauthenticated Access**:

   - Visit app without being logged in
   - Should see login page
   - Should not be able to access any data

2. **Authentication**:

   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should be redirected to main app

3. **User-Specific Data**:

   - Upload documents
   - Create chat sessions
   - Verify data is isolated to your user

4. **Logout**:
   - Click "Sign out"
   - Should be redirected to login page
   - Should not be able to access data

### Test Data Isolation

1. **Multiple Users**:

   - Sign in with different Google accounts
   - Upload documents with each account
   - Verify each user only sees their own documents

2. **API Access**:
   - Test API endpoints with different user tokens
   - Verify data isolation at API level

## Troubleshooting

### Common Issues

1. **Migration Fails**:

   - Check database connection
   - Verify database permissions
   - Check for existing constraints

2. **Authentication Not Working**:

   - Verify Google OAuth credentials
   - Check JWT secret configuration
   - Verify redirect URIs

3. **Data Not Loading**:
   - Check if user is authenticated
   - Verify JWT token is valid
   - Check database for user data

### Debug Commands

```bash
# Check database schema
cd backend
python -c "from app.core.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); print([col['name'] for col in inspector.get_columns('documents')])"

# Check user table
python -c "from app.core.database import SessionLocal, User; db = SessionLocal(); users = db.query(User).all(); print([u.email for u in users])"

# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/auth/me
```

## Configuration

### Required Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

## Migration Notes

### Data Migration

If you have existing data:

1. **Option 1**: Create default user and assign all data
2. **Option 2**: Export data, migrate, then re-import per user
3. **Option 3**: Start fresh (data will be lost)

### Vector Database

The vector database (Qdrant) needs to be updated to include user metadata:

1. **Option 1**: Clear and re-index all documents
2. **Option 2**: Update existing vectors with user metadata
3. **Option 3**: Use user filtering in search queries

## Next Steps

1. **Production Deployment**:

   - Update environment variables
   - Configure proper SSL certificates
   - Set up production database

2. **Additional Features**:

   - User profile management
   - Data export/import
   - User preferences
   - Team/sharing features

3. **Monitoring**:
   - Add authentication logging
   - Monitor API usage per user
   - Set up error tracking

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Test with a fresh database
4. Check Google OAuth configuration

For additional help, refer to the main README.md or create an issue in the repository.
