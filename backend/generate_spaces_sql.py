"""
Generate SQL to populate desk and room tables from floor_data.json
This ensures each space in the JSON gets exactly one database entry.
"""

import json
from pathlib import Path

# Read floor_data.json
floor_data_path = Path(__file__).parent.parent / "frontend" / "public" / "floor_data.json"
with open(floor_data_path, 'r') as f:
    floor_data = json.load(f)

# Type mapping
type_mapping = {
    'managementRoom': 'office',
    'beerPoint': 'beer',
    'billiard': 'beer',
    'wellbeing': 'wellbeing',
    'teamMeetings': 'meeting',
    'trainingRoom1': 'training',
    'trainingRoom2': 'training',
}

# Generate SQL
sql_parts = []

# Header
sql_parts.append("""-- Auto-generated SQL to populate spaces from floor_data.json
-- This script ensures each space gets exactly one database entry
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Insert room types
-- ============================================================================

INSERT INTO public.type (type_name, approval)
VALUES
    ('office', false),
    ('meeting', true),
    ('training', true),
    ('beer', false),
    ('wellbeing', false)
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- STEP 2: Insert desks and rooms
-- ============================================================================
""")

desk_count = 0
room_count = 0

# Process each object in floor_data
for object_name, object_data in floor_data.items():
    is_room = object_data.get('room', 0) == 1

    if object_name == 'desk':
        # Handle desks - each space array item becomes a desk
        spaces = object_data.get('space', [])
        for i, space in enumerate(spaces):
            sql_parts.append(f"""
-- Desk {i}
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-{i}', false)
ON CONFLICT (desk_id) DO NOTHING;
""")
            desk_count += 1

    elif is_room:
        # Handle rooms
        room_type = type_mapping.get(object_name, 'office')

        # Check if this room has sub-objects (like teamMeetings)
        if isinstance(object_data, dict) and any(isinstance(v, dict) and 'space' in v for v in object_data.values() if isinstance(v, dict)):
            # This is a complex room with sub-rooms (like teamMeetings)
            for sub_key, sub_data in object_data.items():
                if isinstance(sub_data, dict) and 'space' in sub_data:
                    spaces = sub_data.get('space', [])
                    if isinstance(spaces, list):
                        for i in range(len(spaces)):
                            room_name = f"{object_name}-{sub_key}-{i}"
                            # Estimate capacity based on chairs
                            chairs = sub_data.get('chairs', [])
                            capacity = len(chairs) if chairs else 4

                            sql_parts.append(f"""
-- Room: {room_name}
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('{room_name}', {capacity}, false, (SELECT type_id FROM public.type WHERE type_name = '{room_type}'))
ON CONFLICT DO NOTHING;
""")
                            room_count += 1
                    else:
                        # Single space object
                        room_name = f"{object_name}-{sub_key}"
                        chairs = sub_data.get('chairs', [])
                        capacity = len(chairs) if chairs else 4

                        sql_parts.append(f"""
-- Room: {room_name}
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('{room_name}', {capacity}, false, (SELECT type_id FROM public.type WHERE type_name = '{room_type}'))
ON CONFLICT DO NOTHING;
""")
                        room_count += 1
        else:
            # Simple room with direct space array
            spaces = object_data.get('space', [])
            if isinstance(spaces, list):
                for i in range(len(spaces)):
                    room_name = f"{object_name}-{i}" if len(spaces) > 1 else object_name
                    # Estimate capacity based on chairs
                    chairs = object_data.get('chairs', [])
                    capacity = len(chairs) if chairs else 6

                    sql_parts.append(f"""
-- Room: {room_name}
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('{room_name}', {capacity}, false, (SELECT type_id FROM public.type WHERE type_name = '{room_type}'))
ON CONFLICT DO NOTHING;
""")
                    room_count += 1

# Footer with verification
sql_parts.append(f"""
-- ============================================================================
-- STEP 3: Verification
-- ============================================================================

-- Expected counts:
-- Desks: {desk_count}
-- Rooms: {room_count}

SELECT 'Desks' as resource_type, COUNT(*) as count FROM public.desk
UNION ALL
SELECT 'Rooms' as resource_type, COUNT(*) as count FROM public.room
UNION ALL
SELECT 'Types' as resource_type, COUNT(*) as count FROM public.type;

-- List all rooms by type
SELECT t.type_name, COUNT(r.room_id) as room_count
FROM public.type t
LEFT JOIN public.room r ON t.type_id = r.type_id
GROUP BY t.type_name
ORDER BY t.type_name;

-- Success! Database is ready for bookings.
""")

# Write SQL file
output_path = Path(__file__).parent / "populate_spaces_generated.sql"
with open(output_path, 'w') as f:
    f.write('\n'.join(sql_parts))

print(f"Generated SQL file: {output_path}")
print(f"Summary:")
print(f"   - Desks: {desk_count}")
print(f"   - Rooms: {room_count}")
print(f"   - Total spaces: {desk_count + room_count}")
print(f"\nNext step: Run {output_path.name} in Supabase SQL Editor")
