"""
Booking-related schemas for API requests and responses
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from enum import Enum


class BookingResourceType(str, Enum):
    """Resource type for booking"""
    DESK = "desk"
    ROOM = "room"


# ============================================================================
# Booking Request Schemas
# ============================================================================

class BookingCreate(BaseModel):
    """Schema for creating a new booking"""
    resource_type: BookingResourceType
    resource_id: int = Field(..., gt=0, description="ID of the desk or room")
    start_time: datetime = Field(..., description="Booking start time")
    end_time: datetime = Field(..., description="Booking end time")

    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

    @validator('start_time')
    def start_time_must_be_in_future(cls, v):
        now = datetime.now(timezone.utc)
        # Make v timezone-aware if it isn't already
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v < now:
            raise ValueError('start_time must be in the future')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "resource_type": "desk",
                "resource_id": 1,
                "start_time": "2025-11-10T09:00:00Z",
                "end_time": "2025-11-10T17:00:00Z"
            }
        }


class BookingUpdate(BaseModel):
    """Schema for updating a booking"""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    pending: Optional[bool] = None

    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'start_time' in values and values['start_time'] and v and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "start_time": "2025-11-10T09:00:00Z",
                "end_time": "2025-11-10T18:00:00Z"
            }
        }


# ============================================================================
# Booking Response Schemas
# ============================================================================

class BookingResponse(BaseModel):
    """Schema for booking response"""
    id: int
    user_id: int
    resource_type: str
    resource_id: int
    resource_name: str
    start_time: datetime
    end_time: datetime
    pending: bool
    duration_minutes: int
    is_active: bool
    is_upcoming: bool
    is_past: bool
    desk_id: Optional[int] = None
    room_id: Optional[int] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": 1,
                "resource_type": "desk",
                "resource_id": 1,
                "resource_name": "desk-0",
                "start_time": "2025-11-10T09:00:00Z",
                "end_time": "2025-11-10T17:00:00Z",
                "pending": False,
                "duration_minutes": 480,
                "is_active": False,
                "is_upcoming": True,
                "is_past": False,
                "desk_id": 1,
                "room_id": None
            }
        }


class BookingListResponse(BaseModel):
    """Schema for list of bookings with pagination"""
    bookings: List[BookingResponse]
    total: int
    page: int
    page_size: int
    has_next: bool

    class Config:
        json_schema_extra = {
            "example": {
                "bookings": [],
                "total": 10,
                "page": 1,
                "page_size": 10,
                "has_next": False
            }
        }


# ============================================================================
# Resource Schemas
# ============================================================================

class DeskResponse(BaseModel):
    """Schema for desk response"""
    id: int
    position_name: str
    occupied: bool

    class Config:
        from_attributes = True


class RoomResponse(BaseModel):
    """Schema for room response"""
    id: int
    name: str
    capacity: int
    occupied: bool
    type_id: int
    type_name: Optional[str] = None
    requires_approval: bool = False

    class Config:
        from_attributes = True


class TypeResponse(BaseModel):
    """Schema for room type response"""
    type_id: int
    type_name: str
    approval: bool

    class Config:
        from_attributes = True


# ============================================================================
# Availability Schemas
# ============================================================================

class TimeSlot(BaseModel):
    """Schema for a time slot"""
    time: str = Field(..., description="Time in HH:MM format")
    available: bool = Field(..., description="Whether this slot is available")

    class Config:
        json_schema_extra = {
            "example": {
                "time": "09:00",
                "available": True
            }
        }


class AvailabilityRequest(BaseModel):
    """Schema for checking availability"""
    resource_type: BookingResourceType
    resource_id: int = Field(..., gt=0)
    date: datetime = Field(..., description="Date to check availability for")

    class Config:
        json_schema_extra = {
            "example": {
                "resource_type": "desk",
                "resource_id": 1,
                "date": "2025-11-10T00:00:00Z"
            }
        }


class AvailabilityResponse(BaseModel):
    """Schema for availability response"""
    resource_type: str
    resource_id: int
    resource_name: str
    date: str
    all_slots: List[str] = Field(..., description="All possible time slots")
    booked_slots: List[str] = Field(..., description="Already booked time slots")
    available_slots: List[str] = Field(..., description="Available time slots")

    class Config:
        json_schema_extra = {
            "example": {
                "resource_type": "desk",
                "resource_id": 1,
                "resource_name": "desk-0",
                "date": "2025-11-10",
                "all_slots": ["08:00", "08:30", "09:00", "09:30"],
                "booked_slots": ["09:00", "09:30"],
                "available_slots": ["08:00", "08:30"]
            }
        }
