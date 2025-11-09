from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.utils.auth import verify_access_token
from app.services.user import UserService, get_user_service


# Security scheme for Bearer token
security = HTTPBearer()


# ============================================================================
# Authentication Dependencies
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
) -> User:
    """
    Dependency to get the current authenticated user.
    Verifies the JWT token and returns the user.
    Raises 401 if token is invalid or user not found.
    """
    # Extract token
    token = credentials.credentials

    # Verify token
    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user ID from payload
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user.
    Raises 403 if user is not active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current verified user.
    Raises 403 if user email is not verified.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user


# ============================================================================
# Role-Based Dependencies
# ============================================================================

async def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current admin user.
    Raises 403 if user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


async def get_current_manager(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current manager or admin user.
    Raises 403 if user is not a manager or admin.
    """
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Manager access required."
        )
    return current_user


# ============================================================================
# Optional Authentication
# ============================================================================

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
) -> Optional[User]:
    """
    Dependency to optionally get the current user.
    Returns None if no valid token is provided.
    Useful for endpoints that work both with and without authentication.
    """
    if not credentials:
        return None

    token = credentials.credentials

    # Verify token
    payload = verify_access_token(token)

    if not payload:
        return None

    # Get user ID from payload
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return None

    # Get user from database
    user = await user_service.get_user_by_id(user_id)

    return user


# ============================================================================
# Utility Functions
# ============================================================================

def has_permission(user: User, required_role: UserRole) -> bool:
    """
    Check if user has required role.
    Admins have all permissions.
    """
    if user.role == UserRole.ADMIN:
        return True

    if required_role == UserRole.MANAGER:
        return user.role in [UserRole.ADMIN, UserRole.MANAGER]

    return user.role == required_role


def check_user_permission(user: User, target_user_id: int) -> bool:
    """
    Check if user has permission to access another user's data.
    Users can access their own data.
    Managers and Admins can access any user's data.
    """
    # Check if it's the same user
    if user.id == target_user_id:
        return True

    # Check if user is manager or admin
    if user.is_manager:
        return True

    return False
