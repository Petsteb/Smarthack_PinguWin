from sqlalchemy import Column, String, Boolean, DateTime, Integer, BigInteger, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
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
    EMPLOYEE = "employee"  # For backwards compatibility


class User(Base):
    """User model"""

    __tablename__ = "users"

    # Primary fields (matching existing schema)
    # Note: user_id uses GENERATED ALWAYS AS IDENTITY in database, so no autoincrement parameter needed
    user_id = Column(BigInteger, primary_key=True)
    email = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text, nullable=False)  # Original field from schema
    hashed_password = Column(Text, nullable=False)
    role = Column(Text, nullable=False, server_default='employee')

    # New optional fields (added via migration)
    username = Column(Text, unique=True, nullable=True, index=True)
    full_name = Column(Text, nullable=True)
    supabase_user_id = Column(UUID(as_uuid=True), unique=True, nullable=True, index=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    department = Column(Text, nullable=True)
    job_title = Column(Text, nullable=True)

    # Status fields
    is_active = Column(Boolean, nullable=False, server_default='true')
    is_verified = Column(Boolean, nullable=False, server_default='false')

    # Gamification
    total_points = Column(Integer, nullable=False, server_default='0')
    level = Column(Integer, nullable=False, server_default='1')
    tokens = Column(Integer, nullable=False, server_default='0')

    # Preferences and metadata
    preferences = Column(JSONB, nullable=False, server_default='{}')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_login = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    bookings = relationship("Booking", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

    @property
    def id(self):
        """Alias for user_id for compatibility"""
        return self.user_id

    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role in ['admin', UserRole.ADMIN.value]

    @property
    def is_manager(self) -> bool:
        """Check if user is manager or admin"""
        return self.role in ['admin', 'manager', UserRole.ADMIN.value, UserRole.MANAGER.value]

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.user_id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name or self.name,  # Fallback to name if full_name not set
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "phone": self.phone,
            "department": self.department,
            "job_title": self.job_title,
            "role": self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "total_points": self.total_points,
            "level": self.level,
            "tokens": self.tokens,
            "preferences": self.preferences,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
