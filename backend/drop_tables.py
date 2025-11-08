"""
Script to drop existing tables and recreate them with correct schema
"""
import asyncio
from app.database import engine, Base
from app.models import user, room, booking, notification, achievement

async def drop_and_create_tables():
    """Drop all tables and recreate them"""
    async with engine.begin() as conn:
        # Drop all tables
        print("Dropping all existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("All tables dropped successfully!")

        # Create all tables with new schema
        print("\nCreating tables with correct schema...")
        await conn.run_sync(Base.metadata.create_all)
        print("All tables created successfully!")

if __name__ == "__main__":
    print("WARNING: This will drop ALL existing tables and data!")
    print("Starting in 3 seconds...")
    import time
    time.sleep(3)

    asyncio.run(drop_and_create_tables())
    print("\nDatabase schema reset complete!")
