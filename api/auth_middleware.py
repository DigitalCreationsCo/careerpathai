"""NextAuth JWT verification middleware for FastAPI with verbose logging."""

import binascii
import json
import os
import uuid
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwe
from jose.constants import ALGORITHMS
import jwt
from jwt.exceptions import InvalidTokenError

from .db import get_db_session, User
from api.logger import logger
import hashlib
import hmac
import requests
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

import httpx
from jose import JWTError
import jwt
from jwt.algorithms import RSAAlgorithm

def derive_aes_key(secret: bytes, length: int = 32) -> bytes:
    """Derive a 256-bit AES key from NextAuth AUTH_SECRET using HKDF."""
    return HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=None,
        info=b"NextAuth.js Generated Encryption Key",
        backend=default_backend()
    ).derive(secret)


class NextAuthMiddleware:
    def __init__(self):
        self.jwks_uri = "https://keycloak.authjs.dev/realms/master/protocol/openid-connect/certs"
        self.issuer = "https://keycloak.authjs.dev/realms/master"
        self.algorithms = ["RS256"]
        self.security = HTTPBearer(auto_error=False)
        self._jwks_cache = None 
        auth_secret = os.getenv("AUTH_SECRET")
        if not auth_secret:
            raise ValueError("AUTH_SECRET environment variable is required")

        try:
            key_bytes = binascii.unhexlify(auth_secret)
            if len(key_bytes) != 32:
                raise ValueError(f"AUTH_SECRET must be 32 bytes (got {len(key_bytes)})")
        except binascii.Error:
            raise ValueError("AUTH_SECRET must be a valid hex string (64 hex chars for 32 bytes)")

        self.auth_secret_bytes = key_bytes
        self.security = HTTPBearer(auto_error=False)
        logger.debug("[NextAuthMiddleware] AUTH_SECRET loaded successfully")

    async def _get_jwks(self):
        """Fetch and cache JWKS from Keycloak."""
        if self._jwks_cache:
            return self._jwks_cache
        async with httpx.AsyncClient() as client:
            response = await client.get(self.jwks_uri, timeout=5.0)
            response.raise_for_status()
            self._jwks_cache = response.json()
            return self._jwks_cache

    async def verify_token(self, token: str) -> dict:
        """Verify session token"""
        try:
            # Decrypt the session cookie
            decrypted_bytes = jwe.decrypt(token, self.auth_secret_bytes)
            payload = json.loads(decrypted_bytes)
            logger.debug(f"[NextAuthMiddleware.verify_token] Token payload: {payload}")
            return payload

        except Exception as e:
            logger.warning(f"[NextAuthMiddleware] Failed to decrypt token: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session cookie")


    #  session token requires decryption, not verification
    # async def verify_token(self, token: str) -> Dict[str, Any]:
    #     """Verify NextAuth JWT token and return payload."""
    #     logger.debug(f"[NextAuthMiddleware.verify_token] Verifying token: {token[:10]}... (truncated)")
    #     try:
    #         payload = jwt.decode(
    #             token,
    #             self.auth_secret,
    #             algorithms=["HS256"],
    #             options={"verify_exp": True}
    #         )
    #         logger.info(f"[NextAuthMiddleware.verify_token] Token verified successfully for payload: {payload}")
    #         return payload
    #     except InvalidTokenError as e:
    #         logger.warning(f"[NextAuthMiddleware.verify_token] Invalid token: {e}")
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail=f"Invalid token: {str(e)}"
    #         )
    
    async def get_user_from_token(self, token: str) -> User:
        """Get user from database using token payload."""
        logger.debug(f"[NextAuthMiddleware.get_user_from_token] Getting user from token: {token[:10]}... (truncated)")
        payload = await self.verify_token(token)
        
        # Extract email from token
        email = payload.get("email")
        logger.debug(f"[NextAuthMiddleware.get_user_from_token] Extracted email from token: {email}")
        if not email:
            logger.error("[NextAuthMiddleware.get_user_from_token] Token missing email.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing email"
            )
        
        # Query user from database
        async with get_db_session() as session:
            from sqlalchemy import select
            logger.debug(f"[NextAuthMiddleware.get_user_from_token] Querying User with email: {email}")
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                logger.warning(f"[NextAuthMiddleware.get_user_from_token] User with email '{email}' not found")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            logger.info(f"[NextAuthMiddleware.get_user_from_token] Found user with email '{email}', id: {getattr(user, 'id', None)}")
            return user
    
    async def get_user_from_cookie(self, request: Request) -> Optional[User]:
        """Extract and verify user from NextAuth session cookie."""
        # Get session token from cookies
        session_token = request.cookies.get("authjs.session-token")
        logger.debug(f"[NextAuthMiddleware.get_user_from_cookie] session_token found: {'yes' if session_token else 'no'}")
        if not session_token:
            logger.info("[NextAuthMiddleware.get_user_from_cookie] No session token in cookies")
            return None
        
        try:
            user = await self.get_user_from_token(session_token)
            logger.info(f"[NextAuthMiddleware.get_user_from_cookie] User found via cookie: {getattr(user, 'id', None)}")
            return user
        except HTTPException as e:
            logger.warning(f"[NextAuthMiddleware.get_user_from_cookie] Failed to get user from cookie token: {e.detail}")
            return None
    
    async def get_user_from_header(self, request: Request) -> Optional[User]:
        """Extract and verify user from Authorization header."""
        credentials: HTTPAuthorizationCredentials = await self.security(request)
        logger.debug(f"[NextAuthMiddleware.get_user_from_header] credentials present: {'yes' if credentials else 'no'}")
        if not credentials:
            logger.info("[NextAuthMiddleware.get_user_from_header] No Authorization header provided")
            return None
        
        try:
            user = await self.get_user_from_token(credentials.credentials)
            logger.info(f"[NextAuthMiddleware.get_user_from_header] User found via header: {getattr(user, 'id', None)}")
            return user
        except HTTPException as e:
            logger.warning(f"[NextAuthMiddleware.get_user_from_header] Failed to get user from header token: {e.detail}")
            return None


# Global middleware instance
logger.debug("[auth_middleware] Instantiating NextAuthMiddleware...")
auth_middleware = NextAuthMiddleware()

async def get_current_user(request: Request) -> User:
    """Dependency to get current authenticated user."""
    logger.info("[get_current_user] Attempting to get user from cookie...")
    # Try cookie first (for web requests)
    user = await auth_middleware.get_user_from_cookie(request)
    if user:
        logger.info(f"[get_current_user] Authenticated user via cookie: {getattr(user, 'id', None)}")
        return user
    
    logger.info("[get_current_user] Attempting to get user from Authorization header...")
    # Try Authorization header (for API requests)
    user = await auth_middleware.get_user_from_header(request)

    # email = payload.get("email")
    # if not email:
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing email")

    # # Query user from DB
    # async with get_db_session() as session:
    #     from sqlalchemy import select
    #     result = await session.execute(select(User).where(User.email == email))
    #     user = result.scalar_one_or_none()
    #     if not user:
    #         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    #     return user

    if user:
        logger.info(f"[get_current_user] Authenticated user via header: {getattr(user, 'id', None)}")
        return user
    
    logger.error("[get_current_user] Authentication required, no valid user found")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required"
    )


async def get_current_user_optional(request: Request) -> Optional[User]:
    """Dependency to get current user if authenticated, None otherwise."""
    logger.info("[get_current_user_optional] Attempting optional authentication from cookie...")
    # Try cookie first (for web requests)
    user = await auth_middleware.get_user_from_cookie(request)
    if user:
        logger.info(f"[get_current_user_optional] Found user via cookie: {getattr(user, 'id', None)}")
        return user
    
    logger.info("[get_current_user_optional] Attempting optional authentication from header...")
    # Try Authorization header (for API requests)
    user = await auth_middleware.get_user_from_header(request)
    if user:
        logger.info(f"[get_current_user_optional] Found user via header: {getattr(user, 'id', None)}")
        return user
    
    logger.info("[get_current_user_optional] No authenticated user found; returning None.")
    return None
