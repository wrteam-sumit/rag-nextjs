from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.database import get_db, User
from app.core.config import settings
from typing import Optional

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    This dependency can be used in any endpoint that requires authentication.
    
    Returns:
        User: The authenticated user object
        
    Raises:
        HTTPException: If user is not authenticated or token is invalid
    """
    # Try to get token from cookies first (for web requests)
    token = request.cookies.get("auth_token")
    
    # If no cookie, try Authorization header (for API requests)
    if not token:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
    
    if not token:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please log in."
        )
    
    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Extract user information from token
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=401, 
                detail="Invalid token payload"
            )
        
        # Find user in database
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            # Fallback: try to find by email
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=404, 
                    detail="User not found"
                )
        
        return user
        
    except JWTError:
        raise HTTPException(
            status_code=401, 
            detail="Invalid or expired token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401, 
            detail=f"Authentication error: {str(e)}"
        )

def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    This is useful for endpoints that work with or without authentication.
    
    Returns:
        Optional[User]: The authenticated user object or None
    """
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None
