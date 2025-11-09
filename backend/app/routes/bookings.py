"""
Booking routes for the API
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date, datetime

from app.database import get_db
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingListResponse,
    DeskResponse,
    RoomResponse,
    AvailabilityRequest,
    AvailabilityResponse,
)
from app.services.booking import BookingService, get_booking_service
from app.middleware.auth import get_current_user, get_current_active_user
from app.models.user import User


router = APIRouter()


# ============================================================================
# Booking Endpoints
# ============================================================================

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_active_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Create a new booking for a desk or room.

    - **resource_type**: Type of resource ("desk" or "room")
    - **resource_id**: ID of the resource to book
    - **start_time**: Booking start time (ISO format)
    - **end_time**: Booking end time (ISO format)
    """
    booking = await booking_service.create_booking(
        user_id=current_user.user_id,
        booking_data=booking_data
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create booking"
        )

    # Load relationships for response
    await booking_service.db.refresh(booking, ["desk", "room", "user"])

    return BookingResponse(**booking.to_dict())


@router.get("/my-bookings", response_model=BookingListResponse)
async def get_my_bookings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    upcoming_only: bool = Query(False, description="Only show upcoming bookings"),
    current_user: User = Depends(get_current_active_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Get all bookings for the current user.

    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10, max: 100)
    - **upcoming_only**: Filter to only upcoming bookings (default: false)
    """
    skip = (page - 1) * page_size
    bookings, total = await booking_service.get_user_bookings(
        user_id=current_user.user_id,
        skip=skip,
        limit=page_size,
        upcoming_only=upcoming_only
    )

    # Load relationships for all bookings
    for booking in bookings:
        await booking_service.db.refresh(booking, ["desk", "room", "user"])

    booking_responses = [BookingResponse(**booking.to_dict()) for booking in bookings]

    return BookingListResponse(
        bookings=booking_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(skip + page_size) < total
    )


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Get a specific booking by ID.

    Users can only view their own bookings unless they are an admin.
    """
    booking = await booking_service.get_booking_by_id(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check if user owns this booking or is admin
    if booking.user_id != current_user.user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this booking"
        )

    # Load relationships
    await booking_service.db.refresh(booking, ["desk", "room", "user"])

    return BookingResponse(**booking.to_dict())


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_data: BookingUpdate,
    current_user: User = Depends(get_current_active_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Update a booking.

    Users can only update their own bookings.
    """
    booking = await booking_service.get_booking_by_id(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check if user owns this booking
    if booking.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this booking"
        )

    updated_booking = await booking_service.update_booking(booking_id, booking_data)

    if not updated_booking:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking"
        )

    # Load relationships
    await booking_service.db.refresh(updated_booking, ["desk", "room", "user"])

    return BookingResponse(**updated_booking.to_dict())


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Cancel a booking.

    Users can only cancel their own bookings.
    """
    booking = await booking_service.get_booking_by_id(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check if user owns this booking
    if booking.user_id != current_user.user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )

    success = await booking_service.cancel_booking(booking_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel booking"
        )

    return None


# ============================================================================
# Resource Endpoints
# ============================================================================

@router.get("/resources/desks", response_model=List[DeskResponse])
async def get_all_desks(
    booking_service: BookingService = Depends(get_booking_service)
):
    """Get all available desks"""
    desks = await booking_service.get_all_desks()
    return [DeskResponse(**desk.to_dict()) for desk in desks]


@router.get("/resources/rooms", response_model=List[RoomResponse])
async def get_all_rooms(
    booking_service: BookingService = Depends(get_booking_service)
):
    """Get all available rooms"""
    rooms = await booking_service.get_all_rooms()

    # Load room_type relationship
    for room in rooms:
        await booking_service.db.refresh(room, ["room_type"])

    return [RoomResponse(**room.to_dict()) for room in rooms]


# ============================================================================
# Availability Endpoints
# ============================================================================

@router.get("/availability/{resource_type}/{resource_id}", response_model=AvailabilityResponse)
async def check_availability(
    resource_type: str,
    resource_id: int,
    check_date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Check availability for a specific resource on a given date.

    - **resource_type**: "desk" or "room"
    - **resource_id**: ID of the resource
    - **check_date**: Date to check (format: YYYY-MM-DD)

    Returns all time slots, booked slots, and available slots for that day.
    """
    if resource_type not in ["desk", "room"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resource_type must be 'desk' or 'room'"
        )

    return await booking_service.get_availability(
        resource_type=resource_type,
        resource_id=resource_id,
        check_date=check_date
    )
