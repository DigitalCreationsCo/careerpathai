"""NextAuth JWT verification middleware for FastAPI with verbose logging."""

import base64
import json
import os
import hmac
import hashlib
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.padding import PKCS7

from .db import get_db_session, User
from api.logger import logger


def base64url_decode(data: str) -> bytes:
    """Decode base64url string, handling padding."""
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)


def derive_keys_from_secret(secret: str, algorithm: str = "A256CBC-HS512") -> tuple:
    """
    Derive encryption and MAC keys from NextAuth AUTH_SECRET.
    
    For A256CBC-HS512:
    - Derives a 64-byte key using HKDF
    - Per RFC 7518 Section 5.2.2.1:
      - First 32 bytes (256 bits): MAC key for HMAC-SHA512 (truncated to 256 bits)
      - Last 32 bytes (256 bits): Encryption key for AES-256-CBC
    """
    # AUTH_SECRET is typically a hex string (64 chars = 32 bytes)
    if len(secret) == 64:
        try:
            secret_bytes = bytes.fromhex(secret)
            logger.debug(f"[derive_keys] Decoded AUTH_SECRET from hex: {len(secret_bytes)} bytes")
        except ValueError:
            secret_bytes = secret.encode('utf-8')
            logger.debug(f"[derive_keys] Using AUTH_SECRET as UTF-8: {len(secret_bytes)} bytes")
    else:
        secret_bytes = secret.encode('utf-8')
        logger.debug(f"[derive_keys] Using AUTH_SECRET as UTF-8: {len(secret_bytes)} bytes")
    
    if algorithm == "A256CBC-HS512":
        # Derive 64 bytes (512 bits) for A256CBC-HS512
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=64,  # 512 bits total
            salt=None,
            info=b"NextAuth.js Generated Encryption Key",
            backend=default_backend()
        ).derive(secret_bytes)
        
        # Per JWE spec: First half for MAC, second half for encryption
        mac_key = derived_key[:32]
        enc_key = derived_key[32:64]
        
        logger.debug(f"[derive_keys] Derived keys - MAC: {len(mac_key)} bytes, ENC: {len(enc_key)} bytes")
        logger.debug(f"[derive_keys] MAC key (first 8 bytes): {mac_key[:8].hex()}")
        logger.debug(f"[derive_keys] ENC key (first 8 bytes): {enc_key[:8].hex()}")
        
        return mac_key, enc_key
    
    elif algorithm == "A256GCM":
        # Derive 32 bytes (256 bits) for A256GCM
        enc_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b"NextAuth.js Generated Encryption Key",
            backend=default_backend()
        ).derive(secret_bytes)
        
        logger.debug(f"[derive_keys] Derived key for A256GCM: {len(enc_key)} bytes")
        return None, enc_key
    
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")


def decrypt_a256cbc_hs512(
    header_b64: str,
    iv: bytes,
    ciphertext: bytes,
    auth_tag: bytes,
    mac_key: bytes,
    enc_key: bytes
) -> bytes:
    """
    Decrypt JWE with A256CBC-HS512 (AES-256-CBC + HMAC-SHA512).
    
    This is the default encryption for NextAuth v5 with database sessions.
    Per RFC 7518 Section 5.2.2.1:
    MAC_INPUT = AAD || IV || CIPHERTEXT || AL
    where AAD = BASE64URL(UTF8(JWE Protected Header))
    and AL = length of AAD in bits as 64-bit big-endian integer
    """
    # AAD = BASE64URL(UTF8(JWE Protected Header))
    aad = header_b64.encode('ascii')
    
    # AL = length of AAD in bits, as 64-bit big-endian
    al = len(aad) * 8
    al_bytes = al.to_bytes(8, byteorder='big')
    
    # Compute HMAC over: AAD || IV || Ciphertext || AL
    # Note: AAD is already base64url encoded header, no extra '.' separators
    mac_input = aad + iv + ciphertext + al_bytes
    
    logger.debug(f"[decrypt_a256cbc_hs512] MAC input components - AAD: {len(aad)}, IV: {len(iv)}, CT: {len(ciphertext)}, AL: {len(al_bytes)}")
    
    # Use HMAC-SHA512, take first 32 bytes (256 bits) as authentication tag
    computed_tag = hmac.new(mac_key, mac_input, hashlib.sha512).digest()[:32]
    
    logger.debug(f"[decrypt_a256cbc_hs512] Computed tag: {computed_tag.hex()[:32]}...")
    logger.debug(f"[decrypt_a256cbc_hs512] Expected tag: {auth_tag.hex()[:32]}...")
    
    # Verify tag
    if not hmac.compare_digest(computed_tag, auth_tag):
        raise ValueError("HMAC authentication failed - invalid tag")
    
    logger.debug("[decrypt_a256cbc_hs512] HMAC verification successful")
    
    # Decrypt using AES-256-CBC
    cipher = Cipher(
        algorithms.AES(enc_key),
        modes.CBC(iv),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    
    # Remove PKCS7 padding
    unpadder = PKCS7(128).unpadder()  # AES block size is 128 bits
    plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
    
    logger.debug(f"[decrypt_a256cbc_hs512] Decryption successful: {len(plaintext)} bytes")
    return plaintext


def decrypt_jwe_token(token: str, mac_key: bytes, enc_key: bytes) -> Dict[str, Any]:
    """
    Decrypt NextAuth JWE token.
    
    JWE Compact Serialization format:
    BASE64URL(Header) || '.' ||
    BASE64URL(Encrypted Key) || '.' ||
    BASE64URL(IV) || '.' ||
    BASE64URL(Ciphertext) || '.' ||
    BASE64URL(Authentication Tag)
    """
    logger.debug(f"[decrypt_jwe_token] Token length: {len(token)}")
    
    try:
        # Split JWE into 5 parts
        parts = token.split('.')
        if len(parts) != 5:
            raise ValueError(f"Invalid JWE format: expected 5 parts, got {len(parts)}")
        
        header_b64, encrypted_key_b64, iv_b64, ciphertext_b64, tag_b64 = parts
        
        # Decode and parse header
        header = json.loads(base64url_decode(header_b64))
        algorithm = header.get('alg')
        encryption = header.get('enc')
        
        logger.debug(f"[decrypt_jwe_token] JWE Header - alg: {algorithm}, enc: {encryption}")
        
        if algorithm != 'dir':
            raise ValueError(f"Unsupported key algorithm: {algorithm} (expected 'dir')")
        
        # Decode components
        iv = base64url_decode(iv_b64)
        ciphertext = base64url_decode(ciphertext_b64)
        auth_tag = base64url_decode(tag_b64)
        
        logger.debug(f"[decrypt_jwe_token] Component sizes - IV: {len(iv)}, CT: {len(ciphertext)}, Tag: {len(auth_tag)}")
        
        # Decrypt based on encryption algorithm
        if encryption == "A256CBC-HS512":
            plaintext = decrypt_a256cbc_hs512(
                header_b64, iv, ciphertext, auth_tag, mac_key, enc_key
            )
        elif encryption == "A256GCM":
            # Use AESGCM for A256GCM
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
            aad = header_b64.encode('ascii')
            ciphertext_with_tag = ciphertext + auth_tag
            aesgcm = AESGCM(enc_key)
            plaintext = aesgcm.decrypt(iv, ciphertext_with_tag, aad)
        else:
            raise ValueError(f"Unsupported encryption: {encryption}")
        
        # Parse JSON payload
        payload = json.loads(plaintext.decode('utf-8'))
        logger.debug(f"[decrypt_jwe_token] Successfully decrypted. Payload keys: {list(payload.keys())}")
        
        return payload
        
    except Exception as e:
        logger.error(f"[decrypt_jwe_token] Decryption failed: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"[decrypt_jwe_token] Traceback: {traceback.format_exc()}")
        raise ValueError(f"Failed to decrypt token: {e}")


class NextAuthMiddleware:
    def __init__(self):
        auth_secret = os.getenv("AUTH_SECRET")
        if not auth_secret:
            raise ValueError("AUTH_SECRET environment variable is required")
        
        self.auth_secret = auth_secret
        
        # Derive keys for A256CBC-HS512 (default NextAuth v5)
        self.mac_key, self.enc_key = derive_keys_from_secret(auth_secret, "A256CBC-HS512")
        
        self.security = HTTPBearer(auto_error=False)
        
        # Log key fingerprints for debugging (NOT the actual keys)
        mac_hash = hashlib.sha256(self.mac_key).hexdigest()[:16]
        enc_hash = hashlib.sha256(self.enc_key).hexdigest()[:16]
        logger.info(f"[NextAuthMiddleware] Initialized (MAC fingerprint: {mac_hash}, ENC fingerprint: {enc_hash})")

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decrypt NextAuth session token.
        """
        logger.debug("[NextAuthMiddleware.verify_token] Starting token verification...")
        
        # Count dots to guess format
        dot_count = token.count('.')
        logger.debug(f"[NextAuthMiddleware.verify_token] Token has {dot_count} dots")
        
        if dot_count != 4:
            logger.error(f"[NextAuthMiddleware.verify_token] Invalid token format (expected 4 dots, got {dot_count})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session token format"
            )
        
        # Try decryption with HKDF-derived keys (standard NextAuth)
        try:
            payload = decrypt_jwe_token(token, self.mac_key, self.enc_key)
            logger.info("[NextAuthMiddleware.verify_token] Successfully decrypted token with HKDF keys")
        except ValueError as e:
            if "HMAC authentication failed" in str(e):
                logger.warning("[NextAuthMiddleware.verify_token] HMAC failed with HKDF keys, trying direct secret...")
                
                # Fallback: Try using the raw secret directly (some NextAuth configs)
                try:
                    secret_bytes = bytes.fromhex(self.auth_secret)
                    # For A256CBC-HS512, we need 64 bytes total
                    # Some implementations use the secret directly, padded/repeated if needed
                    if len(secret_bytes) == 32:
                        # Repeat the 32-byte secret to get 64 bytes
                        full_key = secret_bytes + secret_bytes
                        fallback_mac_key = full_key[:32]
                        fallback_enc_key = full_key[32:64]
                        
                        logger.debug("[NextAuthMiddleware.verify_token] Trying with repeated secret...")
                        payload = decrypt_jwe_token(token, fallback_mac_key, fallback_enc_key)
                        logger.info("[NextAuthMiddleware.verify_token] Successfully decrypted with repeated secret")
                except Exception as e2:
                    logger.error(f"[NextAuthMiddleware.verify_token] All decryption methods failed: {e2}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Invalid or expired session"
                    )
            else:
                logger.error(f"[NextAuthMiddleware.verify_token] Decryption failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid or expired session"
                )
        except Exception as e:
            logger.error(f"[NextAuthMiddleware.verify_token] Unexpected error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )
        
        # Log payload structure (limited for security)
        logger.debug(f"[NextAuthMiddleware.verify_token] Payload keys: {list(payload.keys())}")
        
        # Check expiration
        expires = payload.get('expires')
        if expires:
            from datetime import datetime
            try:
                exp_dt = datetime.fromisoformat(expires.replace('Z', '+00:00'))
                now = datetime.now(exp_dt.tzinfo)
                if now > exp_dt:
                    logger.warning("[NextAuthMiddleware.verify_token] Session expired")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session expired"
                    )
            except ValueError as e:
                logger.warning(f"[NextAuthMiddleware.verify_token] Failed to parse expiration: {e}")
        
        return payload

    async def get_user_from_token(self, token: str) -> User:
        """Get user from database using token payload."""
        logger.debug("[NextAuthMiddleware.get_user_from_token] Extracting user info...")
        payload = await self.verify_token(token)
        
        # Extract email - NextAuth v5 structure: { user: { email, name, ... }, expires, ... }
        email = None
        
        # Try nested user object first
        if 'user' in payload and isinstance(payload['user'], dict):
            email = payload['user'].get('email')
            logger.debug(f"[NextAuthMiddleware.get_user_from_token] Found email in user object: {email}")
        
        # Fallback to root level
        if not email:
            email = payload.get('email')
            logger.debug(f"[NextAuthMiddleware.get_user_from_token] Found email at root: {email}")
        
        # Try 'sub' claim
        if not email:
            email = payload.get('sub')
            logger.debug(f"[NextAuthMiddleware.get_user_from_token] Found email in sub: {email}")
        
        if not email:
            logger.error(f"[NextAuthMiddleware.get_user_from_token] No email in payload. Keys: {list(payload.keys())}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing email"
            )
        
        # Query user from database
        async with get_db_session() as session:
            from sqlalchemy import select
            logger.debug(f"[NextAuthMiddleware.get_user_from_token] Querying user: {email}")
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                logger.warning(f"[NextAuthMiddleware.get_user_from_token] User not found: {email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            logger.info(f"[NextAuthMiddleware.get_user_from_token] User authenticated: {user.id}")
            return user

    async def get_user_from_cookie(self, request: Request) -> Optional[User]:
        """Extract and verify user from NextAuth session cookie."""
        # Try multiple cookie name variations
        cookie_names = [
            "authjs.session-token",
            "__Secure-authjs.session-token",
            "next-auth.session-token",
            "__Secure-next-auth.session-token",
        ]
        
        logger.debug(f"[NextAuthMiddleware.get_user_from_cookie] Available cookies: {list(request.cookies.keys())}")
        
        session_token = None
        used_cookie_name = None
        for cookie_name in cookie_names:
            session_token = request.cookies.get(cookie_name)
            if session_token:
                used_cookie_name = cookie_name
                break
        
        if not session_token:
            logger.info("[NextAuthMiddleware.get_user_from_cookie] No session cookie found")
            return None
        
        logger.info(f"[NextAuthMiddleware.get_user_from_cookie] Found session cookie: {used_cookie_name}")
        
        try:
            user = await self.get_user_from_token(session_token)
            logger.info(f"[NextAuthMiddleware.get_user_from_cookie] User authenticated: {user.id}")
            return user
        except HTTPException as e:
            logger.warning(f"[NextAuthMiddleware.get_user_from_cookie] Authentication failed: {e.detail}")
            return None

    async def get_user_from_header(self, request: Request) -> Optional[User]:
        """Extract and verify user from Authorization header."""
        credentials: HTTPAuthorizationCredentials = await self.security(request)
        if not credentials:
            logger.info("[NextAuthMiddleware.get_user_from_header] No Authorization header")
            return None
        
        try:
            user = await self.get_user_from_token(credentials.credentials)
            logger.info(f"[NextAuthMiddleware.get_user_from_header] User authenticated: {user.id}")
            return user
        except HTTPException as e:
            logger.warning(f"[NextAuthMiddleware.get_user_from_header] Authentication failed: {e.detail}")
            return None


# Global middleware instance
logger.info("[auth_middleware] Initializing NextAuthMiddleware...")
auth_middleware = NextAuthMiddleware()


async def get_current_user(request: Request) -> User:
    """Dependency to get current authenticated user."""
    logger.info("[get_current_user] Attempting authentication...")
    
    # Try cookie first
    user = await auth_middleware.get_user_from_cookie(request)
    if user:
        return user
    
    # Try Authorization header
    user = await auth_middleware.get_user_from_header(request)
    if user:
        return user
    
    logger.error("[get_current_user] Authentication required but not provided")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required"
    )


async def get_current_user_optional(request: Request) -> Optional[User]:
    """Dependency to get current user if authenticated, None otherwise."""
    user = await auth_middleware.get_user_from_cookie(request)
    if user:
        return user
    
    user = await auth_middleware.get_user_from_header(request)
    return user