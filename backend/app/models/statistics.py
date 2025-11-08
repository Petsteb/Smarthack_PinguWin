from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Index, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.database import Base


class UserStatistics(Base):
    """User statistics model - aggregated user metrics"""

    __tablename__ = "user_statistics"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User reference
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Booking statistics
    total_bookings = Column(Integer, default=0, nullable=False)
    completed_bookings = Column(Integer, default=0, nullable=False)
    cancelled_bookings = Column(Integer, default=0, nullable=False)
    no_show_count = Column(Integer, default=0, nullable=False)

    # Usage statistics
    total_hours_booked = Column(Float, default=0.0, nullable=False)
    total_rooms_used = Column(Integer, default=0, nullable=False)
    total_desks_used = Column(Integer, default=0, nullable=False)

    # Streak tracking
    current_streak_days = Column(Integer, default=0, nullable=False)
    longest_streak_days = Column(Integer, default=0, nullable=False)
    last_booking_date = Column(Date, nullable=True)

    # Attendance
    check_in_rate = Column(Float, default=0.0, nullable=False)  # Percentage
    on_time_rate = Column(Float, default=0.0, nullable=False)  # Percentage

    # Collaboration
    total_attendees_invited = Column(Integer, default=0, nullable=False)
    average_meeting_size = Column(Float, default=1.0, nullable=False)

    # Favorite resources (most booked)
    favorite_room_id = Column(UUID(as_uuid=True), nullable=True)
    favorite_desk_id = Column(UUID(as_uuid=True), nullable=True)

    # Time preferences
    preferred_booking_time = Column(String(10), nullable=True)  # "morning", "afternoon", "evening"
    average_booking_duration = Column(Float, default=0.0, nullable=False)  # Minutes

    # Additional metrics
    metrics = Column(JSONB, default=dict, nullable=False)
    # Example: {"most_booked_day": "Wednesday", "peak_hour": 10}

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<UserStatistics user={self.user_id} total_bookings={self.total_bookings}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "total_bookings": self.total_bookings,
            "completed_bookings": self.completed_bookings,
            "cancelled_bookings": self.cancelled_bookings,
            "no_show_count": self.no_show_count,
            "total_hours_booked": self.total_hours_booked,
            "total_rooms_used": self.total_rooms_used,
            "total_desks_used": self.total_desks_used,
            "current_streak_days": self.current_streak_days,
            "longest_streak_days": self.longest_streak_days,
            "last_booking_date": self.last_booking_date.isoformat() if self.last_booking_date else None,
            "check_in_rate": self.check_in_rate,
            "on_time_rate": self.on_time_rate,
            "total_attendees_invited": self.total_attendees_invited,
            "average_meeting_size": self.average_meeting_size,
            "favorite_room_id": str(self.favorite_room_id) if self.favorite_room_id else None,
            "favorite_desk_id": str(self.favorite_desk_id) if self.favorite_desk_id else None,
            "preferred_booking_time": self.preferred_booking_time,
            "average_booking_duration": self.average_booking_duration,
            "metrics": self.metrics,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ResourceStatistics(Base):
    """Resource statistics model - aggregated resource metrics"""

    __tablename__ = "resource_statistics"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Resource reference
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Time period (for historical tracking)
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)
    period_type = Column(String(20), nullable=False)  # "daily", "weekly", "monthly"

    # Booking statistics
    total_bookings = Column(Integer, default=0, nullable=False)
    completed_bookings = Column(Integer, default=0, nullable=False)
    cancelled_bookings = Column(Integer, default=0, nullable=False)
    no_show_count = Column(Integer, default=0, nullable=False)

    # Utilization metrics
    total_hours_booked = Column(Float, default=0.0, nullable=False)
    total_hours_available = Column(Float, default=0.0, nullable=False)
    utilization_rate = Column(Float, default=0.0, nullable=False)  # Percentage

    # Popular times
    peak_hour = Column(Integer, nullable=True)  # 0-23
    peak_day = Column(String(10), nullable=True)  # "monday", "tuesday", etc.

    # User engagement
    unique_users = Column(Integer, default=0, nullable=False)
    repeat_users = Column(Integer, default=0, nullable=False)
    average_booking_duration = Column(Float, default=0.0, nullable=False)  # Minutes

    # Additional metrics
    metrics = Column(JSONB, default=dict, nullable=False)
    # Example: {"most_common_purpose": "meeting", "average_attendees": 4}

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Indexes for performance
    __table_args__ = (
        Index("ix_resource_stats_resource", "resource_type", "resource_id"),
        Index("ix_resource_stats_period", "period_start", "period_end"),
        Index("ix_resource_stats_unique", "resource_type", "resource_id", "period_start", "period_type", unique=True),
    )

    def __repr__(self):
        return f"<ResourceStatistics {self.resource_type} {self.resource_id} utilization={self.utilization_rate}%>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id),
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "period_type": self.period_type,
            "total_bookings": self.total_bookings,
            "completed_bookings": self.completed_bookings,
            "cancelled_bookings": self.cancelled_bookings,
            "no_show_count": self.no_show_count,
            "total_hours_booked": self.total_hours_booked,
            "total_hours_available": self.total_hours_available,
            "utilization_rate": self.utilization_rate,
            "peak_hour": self.peak_hour,
            "peak_day": self.peak_day,
            "unique_users": self.unique_users,
            "repeat_users": self.repeat_users,
            "average_booking_duration": self.average_booking_duration,
            "metrics": self.metrics,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
