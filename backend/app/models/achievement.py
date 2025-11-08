from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SQLEnum, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class AchievementType(str, enum.Enum):
    """Achievement types"""

    BOOKING_MILESTONE = "booking_milestone"  # X bookings made
    EARLY_BIRD = "early_bird"  # Book early consistently
    NIGHT_OWL = "night_owl"  # Late bookings
    PERFECT_ATTENDANCE = "perfect_attendance"  # Never missed a booking
    SOCIAL_BUTTERFLY = "social_butterfly"  # Many collaborative bookings
    SPACE_EXPLORER = "space_explorer"  # Used many different spaces
    TEAM_PLAYER = "team_player"  # Team-related achievements
    EFFICIENCY_EXPERT = "efficiency_expert"  # Optimal space usage
    STREAK = "streak"  # Consecutive booking streaks


class Achievement(Base):
    """Achievement model - defines available achievements"""

    __tablename__ = "achievements"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)

    # Type and category
    type = Column(SQLEnum(AchievementType), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # "bronze", "silver", "gold", "platinum"

    # Requirements
    required_value = Column(Integer, nullable=False)  # Number needed to unlock
    # Example: 10 bookings, 5 different rooms, etc.

    # Rewards
    points_reward = Column(Integer, default=0, nullable=False)
    tokens_reward = Column(Integer, default=0, nullable=False)

    # Display
    icon_url = Column(String(500), nullable=True)
    badge_color = Column(String(20), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)  # Hidden until unlocked

    # Criteria (JSON for complex rules)
    criteria = Column(JSONB, default=dict, nullable=False)
    # Example: {"booking_count": 10, "time_period": "monthly"}

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<Achievement {self.name} ({self.category})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "type": self.type.value,
            "category": self.category,
            "required_value": self.required_value,
            "points_reward": self.points_reward,
            "tokens_reward": self.tokens_reward,
            "icon_url": self.icon_url,
            "badge_color": self.badge_color,
            "is_active": self.is_active,
            "is_hidden": self.is_hidden,
            "criteria": self.criteria,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserAchievement(Base):
    """User achievement model - tracks which users unlocked which achievements"""

    __tablename__ = "user_achievements"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User and achievement
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_id = Column(
        UUID(as_uuid=True),
        ForeignKey("achievements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Progress tracking
    current_value = Column(Integer, default=0, nullable=False)
    is_unlocked = Column(Boolean, default=False, nullable=False, index=True)
    unlocked_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    metadata = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Unique constraint: user can only unlock each achievement once
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    def __repr__(self):
        return f"<UserAchievement user={self.user_id} achievement={self.achievement_id} unlocked={self.is_unlocked}>"

    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage"""
        if not hasattr(self, 'achievement') or not self.achievement:
            return 0.0
        if self.achievement.required_value == 0:
            return 100.0
        return min(100.0, (self.current_value / self.achievement.required_value) * 100)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "achievement_id": str(self.achievement_id),
            "current_value": self.current_value,
            "is_unlocked": self.is_unlocked,
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
