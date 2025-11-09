-- Populate desk and room tables with data from floor_data.json
-- Run this in Supabase SQL Editor
-- ============================================================================
-- STEP 1: Insert room types
-- ============================================================================
-- First check if types already exist, insert only if they don't
INSERT INTO
    public.type (type_name, approval)
VALUES
    ('office', false),
    ('meeting', true),
    ('training', true),
    ('beer', false),
    ('wellbeing', false) ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- STEP 2: Insert rooms based on floor_data.json
-- ============================================================================
-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.booking;
-- DELETE FROM public.managed_rooms;
-- DELETE FROM public.desk;
-- DELETE FROM public.room;
-- Insert beerPoint rooms (4 spaces)
INSERT INTO
    public.room (name, capacity, occupied, type_id)
SELECT
    'beerPoint-' || series.num,
    8, -- capacity estimate
    false,
    (
        SELECT
            type_id
        FROM
            public.type
        WHERE
            type_name = 'beer'
    )
FROM
    generate_series (0, 3) AS series (num) ON CONFLICT DO NOTHING;

-- Insert billiard rooms (2 spaces)
INSERT INTO
    public.room (name, capacity, occupied, type_id)
SELECT
    'billiard-' || series.num,
    4, -- capacity estimate
    false,
    (
        SELECT
            type_id
        FROM
            public.type
        WHERE
            type_name = 'beer'
    )
FROM
    generate_series (0, 1) AS series (num) ON CONFLICT DO NOTHING;

-- Insert managementRoom rooms (3 spaces)
INSERT INTO
    public.room (name, capacity, occupied, type_id)
SELECT
    'managementRoom-' || series.num,
    6, -- capacity estimate
    false,
    (
        SELECT
            type_id
        FROM
            public.type
        WHERE
            type_name = 'office'
    )
FROM
    generate_series (0, 2) AS series (num) ON CONFLICT DO NOTHING;

-- Insert wellbeing room (1 space)
INSERT INTO
    public.room (name, capacity, occupied, type_id)
VALUES
    (
        'wellbeing',
        10,
        false,
        (
            SELECT
                type_id
            FROM
                public.type
            WHERE
                type_name = 'wellbeing'
        )
    ) ON CONFLICT DO NOTHING;

-- Insert teamMeetings rooms (10 spaces)
-- Based on the floor plan, teamMeetings has sub-rooms: small (multiple), round4, round6, etc.
INSERT INTO
    public.room (name, capacity, occupied, type_id)
SELECT
    'teamMeetings-small-' || series.num,
    4, -- small meeting rooms
    false,
    (
        SELECT
            type_id
        FROM
            public.type
        WHERE
            type_name = 'meeting'
    )
FROM
    generate_series (0, 6) AS series (num) ON CONFLICT DO NOTHING;

INSERT INTO
    public.room (name, capacity, occupied, type_id)
VALUES
    (
        'teamMeetings-round4',
        4,
        false,
        (
            SELECT
                type_id
            FROM
                public.type
            WHERE
                type_name = 'meeting'
        )
    ),
    (
        'teamMeetings-round6',
        6,
        false,
        (
            SELECT
                type_id
            FROM
                public.type
            WHERE
                type_name = 'meeting'
        )
    ),
    (
        'teamMeetings-evantai',
        8,
        false,
        (
            SELECT
                type_id
            FROM
                public.type
            WHERE
                type_name = 'meeting'
        )
    ) ON CONFLICT DO NOTHING;

-- Insert trainingRoom1
INSERT INTO
    public.room (name, capacity, occupied, type_id)
VALUES
    (
        'trainingRoom1',
        20,
        false,
        (
            SELECT
                type_id
            FROM
                public.type
            WHERE
                type_name = 'training'
        )
    ) ON CONFLICT DO NOTHING;

-- Insert trainingRoom2
INSERT INTO
    public.room (name, capacity, occupied, type_id)
VALUES
    (
        'trainingRoom2',
        20,
        false,
        (
            SELECT
                type_id
            FROM
                public.type
            WHERE
                type_name = 'training'
        )
    ) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 3: Insert desks (192 individual desk spaces)
-- ============================================================================
-- Generate 192 desks with position names
INSERT INTO
    public.desk (position_name, occupied)
SELECT
    'desk-' || series.num,
    false
FROM
    generate_series (0, 191) AS series (num) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Verification queries
-- ============================================================================
-- Count rooms by type
SELECT
    t.type_name,
    COUNT(r.room_id) as room_count
FROM
    public.type t
    LEFT JOIN public.room r ON t.type_id = r.type_id
GROUP BY
    t.type_name
ORDER BY
    t.type_name;

-- Count desks
SELECT
    COUNT(*) as total_desks
FROM
    public.desk;

-- Show all rooms
SELECT
    r.room_id,
    r.name,
    r.capacity,
    t.type_name,
    r.occupied
FROM
    public.room r
    JOIN public.type t ON r.type_id = t.type_id
ORDER BY
    t.type_name,
    r.name;

-- Migration complete!
-- You can now use the booking system with these spaces.