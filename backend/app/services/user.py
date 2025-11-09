from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from fastapi import Depends

from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserAdminUpdate,
    UserRegister,
    UserStats
)
from app.utils.auth import hash_password, verify_password
from app.database import get_db


class UserService:
    """Service layer for user operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # User CRUD Operations
    # ========================================================================

    async def create_user(
        self,
        user_data: UserRegister,
        role: UserRole = UserRole.USER
    ) -> Optional[User]:
        """Create a new user"""
        try:
            # Hash the password
            hashed_password = hash_password(user_data.password)

            # Create user instance
            user = User(
                email=user_data.email,
                name=user_data.full_name or user_data.email.split('@')[0],  # Use full_name or email prefix
                username=user_data.username,
                full_name=user_data.full_name,
                hashed_password=hashed_password,
                role=role.value if isinstance(role, UserRole) else role,
                preferences={}
            )

            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)

            return user
        except IntegrityError as e:
            await self.db.rollback()
            # Log the actual error for debugging
            print(f"IntegrityError during user creation: {str(e)}")
            print(f"Original error: {e.orig}")
            # Email or username already exists
            return None
        except Exception as e:
            await self.db.rollback()
            # Log unexpected errors
            print(f"Unexpected error during user creation: {type(e).__name__}: {str(e)}")
            raise

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await self.db.execute(
            select(User).where(User.user_id == user_id, User.deleted_at.is_(None))
        )
        return result.scalars().first()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(
            select(User).where(
                func.lower(User.email) == email.lower(),
                User.deleted_at.is_(None)
            )
        )
        return result.scalars().first()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        result = await self.db.execute(
            select(User).where(
                func.lower(User.username) == username.lower(),
                User.deleted_at.is_(None)
            )
        )
        return result.scalars().first()

    async def get_users(
        self,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[User], int]:
        """Get list of users with filtering and pagination"""
        # Build query
        query = select(User).where(User.deleted_at.is_(None))

        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        users = result.scalars().all()

        return users, total

    async def update_user(
        self,
        user_id: int,
        user_data: UserUpdate
    ) -> Optional[User]:
        """Update user profile"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        # Update fields
        update_data = user_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(user)
            return user
        except IntegrityError:
            await self.db.rollback()
            return None

    async def admin_update_user(
        self,
        user_id: int,
        user_data: UserAdminUpdate
    ) -> Optional[User]:
        """Update user (admin operation with more permissions)"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        # Update fields
        update_data = user_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(user)
            return user
        except IntegrityError:
            await self.db.rollback()
            return None

    async def delete_user(self, user_id: int) -> bool:
        """Soft delete a user"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        user.deleted_at = datetime.utcnow()
        user.is_active = False

        await self.db.commit()
        return True

    # ========================================================================
    # Authentication Operations
    # ========================================================================

    async def authenticate_user(
        self,
        email: str,
        password: str
    ) -> Optional[User]:
        """Authenticate a user by email and password"""
        user = await self.get_user_by_email(email)

        if not user:
            return None

        # Check if user is active
        if not user.is_active:
            return None

        # Verify password
        if not verify_password(password, user.hashed_password):
            return None

        # Update last login
        user.last_login = datetime.utcnow()
        await self.db.commit()

        return user

    async def change_password(
        self,
        user_id: int,
        current_password: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        user = await self.get_user_by_id(user_id)

        if not user:
            return False

        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            return False

        # Hash and set new password
        user.hashed_password = hash_password(new_password)

        await self.db.commit()
        return True

    async def reset_password(
        self,
        email: str,
        new_password: str
    ) -> bool:
        """Reset user password (for password reset flow)"""
        user = await self.get_user_by_email(email)

        if not user:
            return False

        # Hash and set new password
        user.hashed_password = hash_password(new_password)

        await self.db.commit()
        return True

    # ========================================================================
    # User Statistics
    # ========================================================================

    async def get_user_stats(self, user_id: int) -> Optional[UserStats]:
        """Get user statistics"""
        user = await self.get_user_by_id(user_id)

        if not user:
            return None

        # TODO: Calculate actual statistics from bookings
        # For now, returning basic user data
        stats = UserStats(
            total_bookings=0,
            active_bookings=0,
            completed_bookings=0,
            cancelled_bookings=0,
            total_hours_booked=0.0,
            points=user.total_points,
            level=user.level,
            tokens=user.tokens,
            achievements_count=0
        )

        return stats

    async def update_user_points(
        self,
        user_id: int,
        points_delta: int
    ) -> Optional[User]:
        """Update user points (for gamification)"""
        user = await self.get_user_by_id(user_id)

        if not user:
            return None

        user.total_points += points_delta

        # Level up logic (every 100 points = 1 level)
        new_level = (user.total_points // 100) + 1
        if new_level > user.level:
            user.level = new_level

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update_user_tokens(
        self,
        user_id: int,
        tokens_delta: int
    ) -> Optional[User]:
        """Update user tokens"""
        user = await self.get_user_by_id(user_id)

        if not user:
            return None

        user.tokens += tokens_delta

        # Ensure tokens don't go negative
        if user.tokens < 0:
            user.tokens = 0

        await self.db.commit()
        await self.db.refresh(user)

        return user

    # ========================================================================
    # User Verification
    # ========================================================================

    async def verify_user_email(self, user_id: int) -> bool:
        """Mark user email as verified"""
        user = await self.get_user_by_id(user_id)

        if not user:
            return False

        user.is_verified = True

        await self.db.commit()
        return True

    async def set_user_active_status(
        self,
        user_id: int,
        is_active: bool
    ) -> bool:
        """Set user active status"""
        user = await self.get_user_by_id(user_id)

        if not user:
            return False

        user.is_active = is_active

        await self.db.commit()
        return True


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Dependency for getting user service"""
    return UserService(db)
