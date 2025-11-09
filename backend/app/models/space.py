"""
Space-related models matching the actual Supabase schema.
These models work with the existing schema.sql database structure.
"""

from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
from enum import Enum

from app.database import Base


class RoomType(str, Enum):
    """Room type enumeration matching database constraint"""
    OFFICE = "office"
    MEETING = "meeting"
    TRAINING = "training"
    BEER = "beer"
    WELLBEING = "wellbeing"


# ============================================================================
# Type Model (maps to 'type' table)
# ============================================================================

class Type(Base):
    """Room type model"""
    __tablename__ = "type"

    type_id = Column(Integer, primary_key=True)
    type_name = Column(Text, nullable=False, unique=True)
    approval = Column(Boolean, nullable=False, default=False)

    # Relationships
    rooms = relationship("Room", back_populates="room_type")

    def __repr__(self):
        return f"<Type(id={self.type_id}, name={self.type_name})>"


# ============================================================================
# Room Model (maps to 'room' table)
# ============================================================================

class Room(Base):
    """Room model"""
    __tablename__ = "room"

    room_id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    capacity = Column(Integer, nullable=False)
    occupied = Column(Boolean, nullable=False, default=False)
    type_id = Column(Integer, ForeignKey("type.type_id"), nullable=False)

    # Relationships
    room_type = relationship("Type", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room", foreign_keys="Booking.room_id")

    def __repr__(self):
        return f"<Room(id={self.room_id}, name={self.name}, capacity={self.capacity})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.room_id,
            "name": self.name,
            "capacity": self.capacity,
            "occupied": self.occupied,
            "type_id": self.type_id,
            "type_name": self.room_type.type_name if self.room_type else None,
            "requires_approval": self.room_type.approval if self.room_type else False,
        }


# ============================================================================
# Desk Model (maps to 'desk' table)
# ============================================================================

class Desk(Base):
    """Desk model"""
    __tablename__ = "desk"

    desk_id = Column(Integer, primary_key=True)
    position_name = Column(Text, nullable=False)
    occupied = Column(Boolean, nullable=False, default=False)

    # Relationships
    bookings = relationship("Booking", back_populates="desk", foreign_keys="Booking.desk_id")

    def __repr__(self):
        return f"<Desk(id={self.desk_id}, position={self.position_name})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.desk_id,
            "position_name": self.position_name,
            "occupied": self.occupied,
        }


# ============================================================================
# Booking Model (maps to 'booking' table)
# ============================================================================

class Booking(Base):
    """Booking model"""
    __tablename__ = "booking"

    booking_id = Column(Integer, primary_key=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    pending = Column(Boolean, nullable=False, default=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    desk_id = Column(Integer, ForeignKey("desk.desk_id"), nullable=True)
    room_id = Column(Integer, ForeignKey("room.room_id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="bookings")
    desk = relationship("Desk", back_populates="bookings", foreign_keys=[desk_id])
    room = relationship("Room", back_populates="bookings", foreign_keys=[room_id])

    def __repr__(self):
        resource = f"desk={self.desk_id}" if self.desk_id else f"room={self.room_id}"
        return f"<Booking(id={self.booking_id}, {resource}, user={self.user_id}, start={self.start_time})>"

    @property
    def is_active(self) -> bool:
        """Check if booking is currently active"""
        now = datetime.now(timezone.utc)
        return self.start_time <= now <= self.end_time and not self.pending

    @property
    def is_upcoming(self) -> bool:
        """Check if booking is upcoming"""
        now = datetime.now(timezone.utc)
        return self.start_time > now and not self.pending

    @property
    def is_past(self) -> bool:
        """Check if booking is in the past"""
        now = datetime.now(timezone.utc)
        return self.end_time < now

    @property
    def duration_minutes(self) -> int:
        """Calculate booking duration in minutes"""
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)

    @property
    def resource_type(self) -> str:
        """Get resource type"""
        return "desk" if self.desk_id else "room"

    @property
    def resource_id(self) -> int:
        """Get resource ID"""
        return self.desk_id if self.desk_id else self.room_id

    @property
    def resource_name(self) -> str:
        """Get resource name"""
        if self.desk:
            return self.desk.position_name
        elif self.room:
            return self.room.name
        return "Unknown"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.booking_id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "pending": self.pending,
            "desk_id": self.desk_id,
            "room_id": self.room_id,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "resource_name": self.resource_name,
            "duration_minutes": self.duration_minutes,
            "is_active": self.is_active,
            "is_upcoming": self.is_upcoming,
            "is_past": self.is_past,
        }
