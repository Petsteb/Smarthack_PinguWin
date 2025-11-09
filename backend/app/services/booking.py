"""
Booking service layer for business logic
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, date, timezone
from fastapi import Depends, HTTPException, status

from app.models.space import Booking, Desk, Room, Type
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    AvailabilityRequest,
    AvailabilityResponse
)
from app.database import get_db


class BookingService:
    """Service for booking operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # Booking CRUD Operations
    # ========================================================================

    async def create_booking(
        self,
        user_id: int,
        booking_data: BookingCreate
    ) -> Optional[Booking]:
        """Create a new booking"""
        try:
            # Verify resource exists
            if booking_data.resource_type == "desk":
                resource = await self.get_desk_by_id(booking_data.resource_id)
                if not resource:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Desk with ID {booking_data.resource_id} not found"
                    )
            else:
                resource = await self.get_room_by_id(booking_data.resource_id)
                if not resource:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Room with ID {booking_data.resource_id} not found"
                    )

            # Check for conflicts
            has_conflict = await self.check_booking_conflict(
                resource_type=booking_data.resource_type,
                resource_id=booking_data.resource_id,
                start_time=booking_data.start_time,
                end_time=booking_data.end_time
            )

            if has_conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This time slot is already booked"
                )

            # Determine if booking needs approval
            pending = False
            if booking_data.resource_type == "room":
                # Check if room type requires approval
                if resource.room_type and resource.room_type.approval:
                    pending = True

            # Create booking
            booking = Booking(
                user_id=user_id,
                desk_id=booking_data.resource_id if booking_data.resource_type == "desk" else None,
                room_id=booking_data.resource_id if booking_data.resource_type == "room" else None,
                start_time=booking_data.start_time,
                end_time=booking_data.end_time,
                pending=pending
            )

            self.db.add(booking)
            await self.db.commit()
            await self.db.refresh(booking)

            return booking

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating booking: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create booking"
            )

    async def get_booking_by_id(self, booking_id: int) -> Optional[Booking]:
        """Get booking by ID"""
        result = await self.db.execute(
            select(Booking).where(Booking.booking_id == booking_id)
        )
        return result.scalars().first()

    async def get_user_bookings(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        upcoming_only: bool = False
    ) -> Tuple[List[Booking], int]:
        """Get bookings for a user"""
        query = select(Booking).where(Booking.user_id == user_id)

        if upcoming_only:
            now = datetime.now(timezone.utc)
            query = query.where(Booking.start_time >= now)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Booking.start_time.desc())
        result = await self.db.execute(query)
        bookings = result.scalars().all()

        return bookings, total

    async def update_booking(
        self,
        booking_id: int,
        booking_data: BookingUpdate
    ) -> Optional[Booking]:
        """Update a booking"""
        booking = await self.get_booking_by_id(booking_id)
        if not booking:
            return None

        # Update fields
        update_data = booking_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(booking, field):
                setattr(booking, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(booking)
            return booking
        except IntegrityError:
            await self.db.rollback()
            return None

    async def cancel_booking(self, booking_id: int) -> bool:
        """Cancel a booking"""
        booking = await self.get_booking_by_id(booking_id)
        if not booking:
            return False

        await self.db.delete(booking)
        await self.db.commit()
        return True

    # ========================================================================
    # Resource Operations
    # ========================================================================

    async def get_desk_by_id(self, desk_id: int) -> Optional[Desk]:
        """Get desk by ID"""
        result = await self.db.execute(
            select(Desk).where(Desk.desk_id == desk_id)
        )
        return result.scalars().first()

    async def get_room_by_id(self, room_id: int) -> Optional[Room]:
        """Get room by ID"""
        result = await self.db.execute(
            select(Room).where(Room.room_id == room_id)
        )
        return result.scalars().first()

    async def get_all_desks(self) -> List[Desk]:
        """Get all desks"""
        result = await self.db.execute(select(Desk))
        return result.scalars().all()

    async def get_all_rooms(self) -> List[Room]:
        """Get all rooms"""
        result = await self.db.execute(select(Room))
        return result.scalars().all()

    async def get_room_by_name(self, name: str) -> Optional[Room]:
        """Get room by name"""
        result = await self.db.execute(
            select(Room).where(Room.name == name)
        )
        return result.scalars().first()

    async def get_desk_by_position_name(self, position_name: str) -> Optional[Desk]:
        """Get desk by position name"""
        result = await self.db.execute(
            select(Desk).where(Desk.position_name == position_name)
        )
        return result.scalars().first()

    # ========================================================================
    # Availability Checking
    # ========================================================================

    async def check_booking_conflict(
        self,
        resource_type: str,
        resource_id: int,
        start_time: datetime,
        end_time: datetime,
        exclude_booking_id: Optional[int] = None
    ) -> bool:
        """Check if there's a booking conflict"""
        query = select(Booking).where(
            and_(
                or_(
                    # Booking starts during our time
                    and_(
                        Booking.start_time >= start_time,
                        Booking.start_time < end_time
                    ),
                    # Booking ends during our time
                    and_(
                        Booking.end_time > start_time,
                        Booking.end_time <= end_time
                    ),
                    # Booking completely encompasses our time
                    and_(
                        Booking.start_time <= start_time,
                        Booking.end_time >= end_time
                    )
                ),
                # Match resource
                Booking.desk_id == resource_id if resource_type == "desk" else Booking.room_id == resource_id
            )
        )

        if exclude_booking_id:
            query = query.where(Booking.booking_id != exclude_booking_id)

        result = await self.db.execute(query)
        conflicts = result.scalars().all()

        return len(conflicts) > 0

    async def get_availability(
        self,
        resource_type: str,
        resource_id: int,
        check_date: date
    ) -> AvailabilityResponse:
        """Get availability for a resource on a specific date"""
        # Get resource info
        if resource_type == "desk":
            resource = await self.get_desk_by_id(resource_id)
            resource_name = resource.position_name if resource else f"desk-{resource_id}"
        else:
            resource = await self.get_room_by_id(resource_id)
            resource_name = resource.name if resource else f"room-{resource_id}"

        # Generate all possible time slots (30-minute intervals from 8:00 to 20:00)
        all_slots = []
        start_hour = 8
        end_hour = 20
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                all_slots.append(f"{hour:02d}:{minute:02d}")

        # Get bookings for this resource on this date
        start_of_day = datetime.combine(check_date, datetime.min.time())
        end_of_day = datetime.combine(check_date, datetime.max.time())

        query = select(Booking).where(
            and_(
                Booking.desk_id == resource_id if resource_type == "desk" else Booking.room_id == resource_id,
                Booking.start_time >= start_of_day,
                Booking.end_time <= end_of_day
            )
        )

        result = await self.db.execute(query)
        bookings = result.scalars().all()

        # Determine which slots are booked
        booked_slots = set()
        for booking in bookings:
            # Get hour and minute from start_time
            booking_start = booking.start_time
            booking_end = booking.end_time

            # Mark all slots from start to end as booked
            current_time = booking_start
            while current_time < booking_end:
                time_str = f"{current_time.hour:02d}:{current_time.minute:02d}"
                if time_str in all_slots:
                    booked_slots.add(time_str)
                current_time += timedelta(minutes=30)

        booked_slots_list = sorted(list(booked_slots))
        available_slots = [slot for slot in all_slots if slot not in booked_slots]

        return AvailabilityResponse(
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            date=check_date.isoformat(),
            all_slots=all_slots,
            booked_slots=booked_slots_list,
            available_slots=available_slots
        )


def get_booking_service(db: AsyncSession = Depends(get_db)) -> BookingService:
    """Dependency for getting booking service"""
    return BookingService(db)
