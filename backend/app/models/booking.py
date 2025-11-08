from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Enum as SQLEnum,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime

from app.database import Base


class BookingStatus(str, enum.Enum):
    """Booking status"""

    PENDING = "pending"  # Awaiting approval
    CONFIRMED = "confirmed"  # Approved and confirmed
    CHECKED_IN = "checked_in"  # User checked in
    COMPLETED = "completed"  # Booking ended
    CANCELLED = "cancelled"  # Cancelled by user
    REJECTED = "rejected"  # Rejected by manager/admin
    NO_SHOW = "no_show"  # User didn't show up


class RecurrencePattern(str, enum.Enum):
    """Recurrence pattern for recurring bookings"""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class Booking(Base):
    """Booking model - represents a single booking"""

    __tablename__ = "bookings"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who made the booking
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Resource being booked (polymorphic - can be room, desk, or facility)
    resource_type = Column(String(50), nullable=False, index=True)
    # Values: "room", "desk", "facility"

    resource_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    # Foreign key to rooms, desks, or facilities table

    # Booking time
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)

    # Status
    status = Column(
        SQLEnum(BookingStatus),
        default=BookingStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Booking details
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    purpose = Column(String(100), nullable=True)  # "meeting", "focused_work", "collaboration"

    # Attendees (for meeting rooms)
    attendee_count = Column(Integer, default=1, nullable=False)
    attendee_emails = Column(JSONB, default=list, nullable=False)
    # Example: ["user1@company.com", "user2@company.com"]

    # Check-in
    requires_checkin = Column(Boolean, default=True, nullable=False)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    check_in_token = Column(String(100), nullable=True, unique=True)

    # Approval
    approved_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Recurring booking reference
    recurring_booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("recurring_bookings.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Integrations
    google_calendar_event_id = Column(String(200), nullable=True)
    teams_meeting_url = Column(String(500), nullable=True)

    # Cancellation
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    # Extra data/metadata
    extra_data = Column(JSONB, default=dict, nullable=False)
    # Example: {"room_setup": "theater", "catering": true}

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Indexes for performance
    __table_args__ = (
        Index("ix_bookings_resource_time", "resource_type", "resource_id", "start_time", "end_time"),
        Index("ix_bookings_user_time", "user_id", "start_time", "end_time"),
        Index("ix_bookings_status_time", "status", "start_time"),
    )

    def __repr__(self):
        return f"<Booking {self.id} - {self.resource_type} {self.status}>"

    @property
    def is_active(self) -> bool:
        """Check if booking is currently active"""
        now = datetime.utcnow()
        return (
            self.status in [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
            and self.start_time <= now <= self.end_time
        )

    @property
    def duration_minutes(self) -> int:
        """Calculate booking duration in minutes"""
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status.value,
            "title": self.title,
            "description": self.description,
            "purpose": self.purpose,
            "attendee_count": self.attendee_count,
            "attendee_emails": self.attendee_emails,
            "requires_checkin": self.requires_checkin,
            "checked_in_at": self.checked_in_at.isoformat() if self.checked_in_at else None,
            "approved_by_id": str(self.approved_by_id) if self.approved_by_id else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "rejection_reason": self.rejection_reason,
            "recurring_booking_id": str(self.recurring_booking_id) if self.recurring_booking_id else None,
            "google_calendar_event_id": self.google_calendar_event_id,
            "teams_meeting_url": self.teams_meeting_url,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
            "cancellation_reason": self.cancellation_reason,
            "extra_data": self.extra_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "duration_minutes": self.duration_minutes,
            "is_active": self.is_active,
        }


class RecurringBooking(Base):
    """Recurring booking model - template for recurring bookings"""

    __tablename__ = "recurring_bookings"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who created the recurring booking
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Resource being booked
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Recurrence pattern
    pattern = Column(SQLEnum(RecurrencePattern), nullable=False)
    interval = Column(Integer, default=1, nullable=False)
    # For daily: every X days
    # For weekly: every X weeks
    # For monthly: every X months

    # Days of week (for weekly pattern)
    days_of_week = Column(JSONB, default=list, nullable=False)
    # Example: [1, 3, 5] for Monday, Wednesday, Friday (0=Sunday, 6=Saturday)

    # Time
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    recurrence_end_date = Column(DateTime(timezone=True), nullable=True)

    # Booking details (same as regular booking)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    purpose = Column(String(100), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<RecurringBooking {self.id} - {self.pattern} {self.resource_type}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id),
            "pattern": self.pattern.value,
            "interval": self.interval,
            "days_of_week": self.days_of_week,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "recurrence_end_date": self.recurrence_end_date.isoformat()
            if self.recurrence_end_date
            else None,
            "title": self.title,
            "description": self.description,
            "purpose": self.purpose,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
