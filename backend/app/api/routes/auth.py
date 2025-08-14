from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.config import settings
from datetime import datetime, timedelta, timezone
from jose import jwt
import httpx

router = APIRouter()


class MeResponse(BaseModel):
    email: str
    name: str | None = None
    avatar_url: str | None = None
    provider: str


def create_jwt(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token


@router.get("/google/login")
async def google_login():
    """Return Google's OAuth2 authorization URL for client to redirect to."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    from urllib.parse import urlencode

    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": url}


@router.get("/google/callback")
async def google_callback(code: str, response: Response, db: Session = Depends(get_db)):
    """Handle Google OAuth2 callback, create user if needed, set JWT cookie, redirect to frontend."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        token_res = await client.post(token_url, data=data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        token_json = token_res.json()

        id_token = token_json.get("id_token")
        access_token = token_json.get("access_token")
        if not id_token and not access_token:
            raise HTTPException(status_code=400, detail="No token received from Google")

        # Fetch user info
        userinfo = None
        if access_token:
            ures = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if ures.status_code == 200:
                userinfo = ures.json()

    if not userinfo and id_token:
        # Decode id_token locally if needed
        try:
            userinfo = jwt.get_unverified_claims(id_token)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid id_token from Google")

    if not userinfo:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    google_sub = userinfo.get("sub")
    email = userinfo.get("email")
    name = userinfo.get("name")
    picture = userinfo.get("picture")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    # Upsert user
    from app.core.database import User

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            user_id=google_sub or email,
            email=email,
            name=name,
            avatar_url=picture,
            provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update profile fields on each login
        user.user_id = user.user_id or (google_sub or email)
        user.name = name
        user.avatar_url = picture
        user.provider = "google"
        db.commit()

    # Issue JWT and redirect to frontend with token so frontend can store it
    token = create_jwt({"sub": user.user_id, "email": user.email, "name": user.name})
    redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={token}"
    return Response(status_code=307, headers={"Location": redirect_url})


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("auth_token", path="/")
    return {"success": True}


@router.get("/me", response_model=MeResponse)
async def me(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("auth_token")
    if not token:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    from app.core.database import User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(email=user.email, name=user.name, avatar_url=user.avatar_url, provider=user.provider)


