from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SQLEnum, Text, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.database import Base


class ResourceType(str, enum.Enum):
    """Resource types"""

    ROOM = "room"
    DESK = "desk"
    FACILITY = "facility"
    CHAIR = "chair"
    TABLE = "table"
    WALL = "wall"
    DOOR = "door"


class ResourceStatus(str, enum.Enum):
    """Resource status"""

    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    DISABLED = "disabled"


class Room(Base):
    """Room model - represents meeting rooms, conference rooms, etc."""

    __tablename__ = "rooms"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(100), unique=True, nullable=True, index=True)  # From floor plan JSON
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Type and status
    type = Column(SQLEnum(ResourceType), default=ResourceType.ROOM, nullable=False, index=True)
    status = Column(SQLEnum(ResourceStatus), default=ResourceStatus.AVAILABLE, nullable=False, index=True)

    # Location data from floor plan
    floor_number = Column(Integer, default=1, nullable=False, index=True)
    polygon_data = Column(JSONB, nullable=True)  # Polygon coordinates from JSON
    # Example: [{"x": 100, "y": 200}, {"x": 150, "y": 200}, ...]

    bounds = Column(JSONB, nullable=True)  # Bounding box data
    # Example: {"minX": 100, "maxX": 500, "minY": 200, "maxY": 600, "centerX": 300, "centerY": 400}

    # Capacity and features
    capacity = Column(Integer, default=1, nullable=False)
    amenities = Column(ARRAY(String), default=list, nullable=False)
    # Example: ["projector", "whiteboard", "video_conferencing", "phone"]

    # Booking settings
    is_bookable = Column(Boolean, default=True, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)
    min_booking_duration = Column(Integer, default=30, nullable=False)  # Minutes
    max_booking_duration = Column(Integer, default=480, nullable=False)  # Minutes (8 hours)
    advance_booking_days = Column(Integer, default=30, nullable=False)

    # Equipment and features
    equipment = Column(JSONB, default=dict, nullable=False)
    # Example: {"projector": true, "screen_size": "65 inch", "whiteboard": true}

    # Images and media
    image_urls = Column(ARRAY(String), default=list, nullable=False)
    mesh_type = Column(String(50), nullable=True)  # Which 3D mesh to use

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Room {self.name} ({self.type})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "external_id": self.external_id,
            "name": self.name,
            "description": self.description,
            "type": self.type.value,
            "status": self.status.value,
            "floor_number": self.floor_number,
            "polygon_data": self.polygon_data,
            "bounds": self.bounds,
            "capacity": self.capacity,
            "amenities": self.amenities,
            "is_bookable": self.is_bookable,
            "requires_approval": self.requires_approval,
            "min_booking_duration": self.min_booking_duration,
            "max_booking_duration": self.max_booking_duration,
            "advance_booking_days": self.advance_booking_days,
            "equipment": self.equipment,
            "image_urls": self.image_urls,
            "mesh_type": self.mesh_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Desk(Base):
    """Desk model - represents individual workstations"""

    __tablename__ = "desks"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(100), unique=True, nullable=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Location
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=True)
    floor_number = Column(Integer, default=1, nullable=False, index=True)
    polygon_data = Column(JSONB, nullable=True)
    bounds = Column(JSONB, nullable=True)

    # Status
    status = Column(SQLEnum(ResourceStatus), default=ResourceStatus.AVAILABLE, nullable=False, index=True)

    # Features
    has_monitor = Column(Boolean, default=False, nullable=False)
    has_keyboard = Column(Boolean, default=False, nullable=False)
    has_mouse = Column(Boolean, default=False, nullable=False)
    is_standing_desk = Column(Boolean, default=False, nullable=False)
    equipment = Column(JSONB, default=dict, nullable=False)

    # Booking settings
    is_bookable = Column(Boolean, default=True, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)

    # Images
    image_urls = Column(ARRAY(String), default=list, nullable=False)
    mesh_type = Column(String(50), default="desk", nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Desk {self.name}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "external_id": self.external_id,
            "name": self.name,
            "description": self.description,
            "room_id": str(self.room_id) if self.room_id else None,
            "floor_number": self.floor_number,
            "polygon_data": self.polygon_data,
            "bounds": self.bounds,
            "status": self.status.value,
            "has_monitor": self.has_monitor,
            "has_keyboard": self.has_keyboard,
            "has_mouse": self.has_mouse,
            "is_standing_desk": self.is_standing_desk,
            "equipment": self.equipment,
            "is_bookable": self.is_bookable,
            "requires_approval": self.requires_approval,
            "image_urls": self.image_urls,
            "mesh_type": self.mesh_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Facility(Base):
    """Facility model - represents other bookable resources (parking, lockers, etc.)"""

    __tablename__ = "facilities"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(100), unique=True, nullable=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    facility_type = Column(String(50), nullable=False, index=True)
    # Examples: "parking", "locker", "gym", "kitchen", "phone_booth"

    # Location
    floor_number = Column(Integer, default=1, nullable=False, index=True)
    polygon_data = Column(JSONB, nullable=True)
    bounds = Column(JSONB, nullable=True)

    # Status
    status = Column(SQLEnum(ResourceStatus), default=ResourceStatus.AVAILABLE, nullable=False, index=True)

    # Booking settings
    is_bookable = Column(Boolean, default=True, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)
    max_booking_duration = Column(Integer, default=480, nullable=False)  # Minutes

    # Features
    features = Column(JSONB, default=dict, nullable=False)

    # Images
    image_urls = Column(ARRAY(String), default=list, nullable=False)
    mesh_type = Column(String(50), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Facility {self.name} ({self.facility_type})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "external_id": self.external_id,
            "name": self.name,
            "description": self.description,
            "facility_type": self.facility_type,
            "floor_number": self.floor_number,
            "polygon_data": self.polygon_data,
            "bounds": self.bounds,
            "status": self.status.value,
            "is_bookable": self.is_bookable,
            "requires_approval": self.requires_approval,
            "max_booking_duration": self.max_booking_duration,
            "features": self.features,
            "image_urls": self.image_urls,
            "mesh_type": self.mesh_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RoomAmenity(Base):
    """Predefined room amenities"""

    __tablename__ = "room_amenities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)  # Icon name or URL

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<RoomAmenity {self.name}>"
