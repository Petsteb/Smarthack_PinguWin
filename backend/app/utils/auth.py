from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
from uuid import UUID
import secrets

from app.config import settings


# ============================================================================
# Password Utilities
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Note: Bcrypt has a 72-byte limit. Passwords are automatically truncated
    to 72 bytes after UTF-8 encoding to comply with this limitation.
    """
    # Truncate password to 72 bytes (bcrypt limitation)
    password_bytes = password.encode('utf-8')[:72]

    # Generate salt and hash the password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)

    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Note: Passwords are truncated to 72 bytes to match the hashing behavior.
    """
    # Truncate password to 72 bytes (same as hashing)
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')

    # Verify password
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ============================================================================
# JWT Utilities
# ============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })

    # Convert UUID to string if present
    if "sub" in to_encode and isinstance(to_encode["sub"], UUID):
        to_encode["sub"] = str(to_encode["sub"])

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })

    # Convert UUID to string if present
    if "sub" in to_encode and isinstance(to_encode["sub"], UUID):
        to_encode["sub"] = str(to_encode["sub"])

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify an access token and return payload if valid"""
    payload = decode_token(token)

    if not payload:
        return None

    # Check if it's an access token
    if payload.get("type") != "access":
        return None

    # Check expiration
    exp = payload.get("exp")
    if exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
        return None

    return payload


def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a refresh token and return payload if valid"""
    payload = decode_token(token)

    if not payload:
        return None

    # Check if it's a refresh token
    if payload.get("type") != "refresh":
        return None

    # Check expiration
    exp = payload.get("exp")
    if exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
        return None

    return payload


def create_password_reset_token(email: str) -> str:
    """Create a password reset token"""
    expires_delta = timedelta(hours=1)  # Reset tokens expire in 1 hour

    data = {
        "email": email,
        "type": "password_reset",
        "random": secrets.token_urlsafe(16)  # Add randomness for security
    }

    expire = datetime.utcnow() + expires_delta
    data.update({"exp": expire, "iat": datetime.utcnow()})

    token = jwt.encode(
        data,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return token


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token and return email if valid"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        if payload.get("type") != "password_reset":
            return None

        # Check expiration
        exp = payload.get("exp")
        if exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
            return None

        return payload.get("email")
    except JWTError:
        return None


def generate_verification_token() -> str:
    """Generate a random verification token"""
    return secrets.token_urlsafe(32)
