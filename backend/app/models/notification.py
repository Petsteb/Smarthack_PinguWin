from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class NotificationType(str, enum.Enum):
    """Notification types"""

    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_REMINDER = "booking_reminder"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_REJECTED = "booking_rejected"
    BOOKING_APPROVAL_NEEDED = "booking_approval_needed"
    CHECK_IN_REMINDER = "check_in_reminder"
    BOOKING_ENDING_SOON = "booking_ending_soon"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    LEVEL_UP = "level_up"
    RESOURCE_MAINTENANCE = "resource_maintenance"
    SYSTEM_ANNOUNCEMENT = "system_announcement"


class NotificationStatus(str, enum.Enum):
    """Notification status"""

    PENDING = "pending"
    SENT = "sent"
    READ = "read"
    FAILED = "failed"


class Notification(Base):
    """Notification model"""

    __tablename__ = "notifications"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User receiving the notification
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Notification details
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    # Status
    status = Column(
        SQLEnum(NotificationStatus),
        default=NotificationStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Related resources
    related_booking_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    related_resource_id = Column(UUID(as_uuid=True), nullable=True)
    related_resource_type = Column(String(50), nullable=True)

    # Action link
    action_url = Column(String(500), nullable=True)
    action_text = Column(String(100), nullable=True)

    # Delivery channels
    sent_via_email = Column(Boolean, default=False, nullable=False)
    sent_via_push = Column(Boolean, default=False, nullable=False)
    sent_via_websocket = Column(Boolean, default=True, nullable=False)

    # Read tracking
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Additional data
    metadata = Column(JSONB, default=dict, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Notification {self.type} for user {self.user_id}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "status": self.status.value,
            "related_booking_id": str(self.related_booking_id) if self.related_booking_id else None,
            "related_resource_id": str(self.related_resource_id) if self.related_resource_id else None,
            "related_resource_type": self.related_resource_type,
            "action_url": self.action_url,
            "action_text": self.action_text,
            "sent_via_email": self.sent_via_email,
            "sent_via_push": self.sent_via_push,
            "sent_via_websocket": self.sent_via_websocket,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }
