from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserAdminUpdate,
    UserListResponse,
    UserProfile,
    UserStats
)
from app.services.user import UserService, get_user_service
from app.middleware.auth import (
    get_current_user,
    get_current_active_user,
    get_current_admin,
    get_current_manager,
    check_user_permission
)
from app.models.user import User, UserRole


router = APIRouter()


# ============================================================================
# User Profile Endpoints
# ============================================================================

@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's full profile.

    Returns detailed profile information for the authenticated user.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update current user's profile.

    Users can update:
    - username
    - full_name
    - bio
    - phone
    - department
    - job_title
    - avatar_url
    - preferences
    """
    updated_user = await user_service.update_user(current_user.id, user_data)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile. Username may already be taken."
        )

    return updated_user


@router.get("/me/stats", response_model=UserStats)
async def get_my_stats(
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get current user's statistics.

    Returns:
    - Booking statistics
    - Points and level
    - Tokens
    - Achievements count
    """
    stats = await user_service.get_user_stats(current_user.id)

    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stats not found"
        )

    return stats


# ============================================================================
# Public User Endpoints
# ============================================================================

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get user by ID.

    Users can view:
    - Their own profile (full details)
    - Other users' public profiles (limited details)

    Managers and admins can view full details of all users.
    """
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check permissions
    if not check_user_permission(current_user, user_id):
        # Return limited public profile for non-managers
        # (You could create a separate schema for public profiles)
        pass

    return user


@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get user statistics by ID.

    Access control:
    - Users can view their own stats
    - Managers and admins can view any user's stats
    """
    # Check permissions
    if not check_user_permission(current_user, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this user's stats"
        )

    stats = await user_service.get_user_stats(user_id)

    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stats not found"
        )

    return stats


# ============================================================================
# Admin/Manager Endpoints
# ============================================================================

@router.get("/", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_manager),
    user_service: UserService = Depends(get_user_service)
):
    """
    List all users with pagination and filtering.

    Access: Manager and Admin only

    Query parameters:
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **role**: Filter by user role
    - **is_active**: Filter by active status
    """
    users, total = await user_service.get_users(
        skip=skip,
        limit=limit,
        role=role,
        is_active=is_active
    )

    # Calculate pagination info
    total_pages = (total + limit - 1) // limit
    current_page = (skip // limit) + 1

    return UserListResponse(
        users=users,
        total=total,
        page=current_page,
        per_page=limit,
        total_pages=total_pages
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserAdminUpdate,
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user (admin only).

    Access: Admin only

    Admins can update:
    - All profile fields
    - User role
    - Active status
    - Verified status
    - Points, level, and tokens
    """
    updated_user = await user_service.admin_update_user(user_id, user_data)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or update failed"
        )

    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Delete user (soft delete).

    Access: Admin only

    This performs a soft delete - the user is marked as deleted but not
    removed from the database.
    """
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    success = await user_service.delete_user(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return None


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Activate a user account.

    Access: Admin only
    """
    success = await user_service.set_user_active_status(user_id, True)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user = await user_service.get_user_by_id(user_id)
    return user


@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Deactivate a user account.

    Access: Admin only
    """
    # Prevent self-deactivation
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    success = await user_service.set_user_active_status(user_id, False)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user = await user_service.get_user_by_id(user_id)
    return user


@router.post("/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Manually verify a user's email.

    Access: Admin only
    """
    success = await user_service.verify_user_email(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user = await user_service.get_user_by_id(user_id)
    return user


# ============================================================================
# Gamification Endpoints
# ============================================================================

@router.post("/{user_id}/points", response_model=UserResponse)
async def update_user_points(
    user_id: int,
    points_delta: int = Query(..., description="Points to add (positive) or remove (negative)"),
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user points (for gamification).

    Access: Admin only

    - **points_delta**: Number of points to add (positive) or remove (negative)
    """
    user = await user_service.update_user_points(user_id, points_delta)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.post("/{user_id}/tokens", response_model=UserResponse)
async def update_user_tokens(
    user_id: int,
    tokens_delta: int = Query(..., description="Tokens to add (positive) or remove (negative)"),
    current_user: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user tokens.

    Access: Admin only

    - **tokens_delta**: Number of tokens to add (positive) or remove (negative)
    """
    user = await user_service.update_user_tokens(user_id, tokens_delta)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user
