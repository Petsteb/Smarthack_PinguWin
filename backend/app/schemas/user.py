from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.user import UserRole


# ============================================================================
# Authentication Schemas
# ============================================================================

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefresh(BaseModel):
    """Schema for refreshing access token"""
    refresh_token: str


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


class PasswordReset(BaseModel):
    """Schema for password reset"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password reset"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


# ============================================================================
# User Profile Schemas
# ============================================================================

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user (internal use)"""
    password: str
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class UserPreferences(BaseModel):
    """Schema for user preferences"""
    notifications_enabled: bool = True
    email_notifications: bool = True
    theme: str = "light"
    language: str = "en"
    timezone: str = "UTC"


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    total_points: int
    level: int
    tokens: int
    preferences: Dict[str, Any]
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class UserListResponse(BaseModel):
    """Schema for user list response"""
    users: list[UserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class UserProfile(UserResponse):
    """Extended user profile with additional details"""
    supabase_user_id: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


# ============================================================================
# User Stats Schemas
# ============================================================================

class UserStats(BaseModel):
    """Schema for user statistics"""
    total_bookings: int = 0
    active_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0
    total_hours_booked: float = 0.0
    favorite_room: Optional[str] = None
    favorite_desk: Optional[str] = None
    points: int = 0
    level: int = 1
    tokens: int = 0
    achievements_count: int = 0


# ============================================================================
# Admin Schemas
# ============================================================================

class UserAdminUpdate(BaseModel):
    """Schema for admin updating user (includes role and status)"""
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    total_points: Optional[int] = None
    level: Optional[int] = None
    tokens: Optional[int] = None
