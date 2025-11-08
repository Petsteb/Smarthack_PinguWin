from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from datetime import datetime
import uuid
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """User roles"""

    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


class User(Base):
    """User model"""

    __tablename__ = "users"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=True, index=True)
    full_name = Column(String(255), nullable=True)

    # Authentication (Supabase handles this, but we store reference)
    supabase_user_id = Column(UUID(as_uuid=True), unique=True, nullable=True, index=True)

    # Profile
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    job_title = Column(String(100), nullable=True)

    # Role and permissions
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Gamification
    total_points = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    tokens = Column(Integer, default=0, nullable=False)

    # Preferences
    preferences = Column(JSONB, default=dict, nullable=False)
    # Example preferences: {"notifications_enabled": true, "theme": "light", "language": "en"}

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_login = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN

    @property
    def is_manager(self) -> bool:
        """Check if user is manager or admin"""
        return self.role in [UserRole.ADMIN, UserRole.MANAGER]

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "phone": self.phone,
            "department": self.department,
            "job_title": self.job_title,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "total_points": self.total_points,
            "level": self.level,
            "tokens": self.tokens,
            "preferences": self.preferences,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
