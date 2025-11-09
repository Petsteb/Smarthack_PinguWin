from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict

from app.database import get_db
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefresh,
    PasswordChange,
    PasswordReset,
    PasswordResetConfirm,
    UserResponse
)
from app.services.user import UserService, get_user_service
from app.middleware.auth import get_current_user, get_current_active_user
from app.models.user import User
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    create_password_reset_token,
    verify_password_reset_token
)
from app.config import settings


router = APIRouter()


# ============================================================================
# Authentication Endpoints
# ============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """
    Register a new user account.

    - **email**: Valid email address (must be unique)
    - **password**: Minimum 8 characters with at least one uppercase, lowercase, and digit
    - **full_name**: Optional full name
    - **username**: Optional username (must be unique if provided)
    """
    # Check if email already exists
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists (if provided)
    if user_data.username:
        existing_username = await user_service.get_user_by_username(user_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    # Create new user
    user = await user_service.create_user(user_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    # TODO: Send verification email
    # background_tasks.add_task(send_verification_email, user.email)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """
    Authenticate user and return access/refresh tokens.

    - **email**: User email
    - **password**: User password

    Returns:
    - **access_token**: JWT token for API authentication (expires in 30 minutes)
    - **refresh_token**: JWT token for refreshing access token (expires in 7 days)
    """
    # Authenticate user
    user = await user_service.authenticate_user(user_data.email, user_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens
    # Note: user.role is a string from database, not an enum
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role}

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """
    Refresh access token using refresh token.

    - **refresh_token**: Valid refresh token

    Returns new access and refresh tokens.
    """
    # Verify refresh token
    payload = verify_refresh_token(token_data.refresh_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user
    user_id = payload.get("sub")
    user = await user_service.get_user_by_id(int(user_id))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create new tokens
    # Note: user.role is a string from database, not an enum
    new_token_data = {"sub": str(user.id), "email": user.email, "role": user.role}

    access_token = create_access_token(data=new_token_data)
    new_refresh_token = create_refresh_token(data=new_token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user.

    Note: Since we're using JWT tokens, logout is handled client-side by
    removing the tokens. This endpoint is provided for logging purposes.
    """
    # TODO: Optionally add token to blacklist in Redis
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user information.

    Returns the user profile of the currently logged-in user.
    """
    return current_user


# ============================================================================
# Password Management
# ============================================================================

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Change password for the current user.

    - **current_password**: Current password
    - **new_password**: New password (minimum 8 characters with complexity requirements)
    """
    success = await user_service.change_password(
        current_user.id,
        password_data.current_password,
        password_data.new_password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    password_data: PasswordReset,
    background_tasks: BackgroundTasks,
    user_service: UserService = Depends(get_user_service)
):
    """
    Request password reset email.

    - **email**: Email address of the account

    Sends a password reset link to the email if the account exists.
    Always returns success to prevent email enumeration.
    """
    # Get user by email
    user = await user_service.get_user_by_email(password_data.email)

    if user:
        # Create password reset token
        reset_token = create_password_reset_token(user.email)

        # TODO: Send reset email
        # background_tasks.add_task(send_password_reset_email, user.email, reset_token)

        # For development, return the token (REMOVE IN PRODUCTION)
        if settings.DEBUG:
            return {
                "message": "Password reset email sent",
                "token": reset_token  # REMOVE IN PRODUCTION
            }

    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    user_service: UserService = Depends(get_user_service)
):
    """
    Reset password using reset token.

    - **token**: Password reset token from email
    - **new_password**: New password
    """
    # Verify reset token
    email = verify_password_reset_token(reset_data.token)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Reset password
    success = await user_service.reset_password(email, reset_data.new_password)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "Password reset successfully"}


@router.post("/verify-email/{token}")
async def verify_email(
    token: str,
    user_service: UserService = Depends(get_user_service)
):
    """
    Verify user email using verification token.

    - **token**: Email verification token
    """
    # TODO: Implement email verification logic
    # For now, just return a placeholder
    return {"message": "Email verification endpoint (to be implemented)"}
