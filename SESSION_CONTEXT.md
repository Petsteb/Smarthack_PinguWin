# SmartHack PinguWin - Session Context

**Last Updated:** 2025-11-08
**Project:** Room and Desk Booking System with 3D Floor Plan Visualization

---

## Project Overview

This is a web application for booking rooms and desks with an interactive 3D floor plan viewer. The system uses:
- **Backend:** FastAPI + Supabase (PostgreSQL) + Redis + Celery
- **Frontend:** React + TypeScript + Three.js (for 3D visualization)
- **Database:** Supabase PostgreSQL
- **Real-time:** WebSockets + Redis

---

## Current Application State

### Running Services

**Backend:**
- Running on http://127.0.0.1:8000
- Database initialization TEMPORARILY DISABLED (due to schema issues)
- Swagger docs available at http://127.0.0.1:8000/docs
- Status: RUNNING (multiple background instances)

**Frontend:**
- Running on http://localhost:5176
- 3D Floor Plan Viewer at http://localhost:5176/floor-plan
- Status: RUNNING (multiple background instances)

### Recent Major Changes

1. **Backend Dependency Fixes** ✅
   - Upgraded supabase from 2.3.4 to 2.24.0
   - Upgraded httpx from 0.25.2 to 0.28.1
   - Upgraded pydantic to 2.12.4
   - Upgraded websockets to 15.0.1

2. **Backend Database Schema Fixes** ✅
   - Fixed reserved column name conflicts (metadata → extra_data)
   - Updated models: booking.py, notification.py, achievement.py, audit.py
   - Temporarily disabled database initialization in main.py (line 26)

3. **Complete Frontend Rewrite for New Data Structure** ✅
   - Migrated from out.json to floor_data.json
   - Complete rewrite of FloorPlanViewer3D.tsx
   - New data structure with recursive room objects
   - Implemented filter panel for selective rendering
   - Added unique colors for each room
   - Walls and tables rendered as extruded boxes (not meshes)

---

## Floor Plan Data Structure

### File: `floor_data.json`

**Location:**
- Root: `C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin\floor_data.json`
- Frontend: `frontend/public/floor_data.json`

**Structure Discovered:**

```json
{
  "walls": {
    "interior": [ /* 145 wall rectangles */ ]
  },
  "beerPoint": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "chairs": [ /* chair rectangles */ ],
    "tables": [ /* table rectangles */ ]
  },
  "billiard": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "tables": [ /* table rectangles */ ]
  },
  "managementRoom": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "chairs": [ /* rectangles */ ],
    "tables": [ /* table rectangles */ ]
  },
  "teamMeetings": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "small": {
      "space": [ /* rectangles */ ],
      "chairs": [ /* rectangles */ ],
      "tables": [ /* table rectangles */ ]
    },
    "round4": {
      "space": [ /* rectangles */ ],
      "chairs": [ /* chairs */ ],
      "tables": [ /* tables */ ]
    },
    "square4": {
      "space": [ /* rectangles */ ],
      "chairs": [ /* chairs */ ],
      "tables": [ /* tables */ ]
    }
  },
  "trainingRoom1": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "chairs": [ /* chairs */ ],
    "tables": [ /* tables */ ]
  },
  "trainingRoom2": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "chairs": [ /* chairs */ ],
    "tables": [ /* tables */ ]
  },
  "wellbeing": {
    "space": [ /* rectangles */ ],
    "room": 1,
    "couch": [ /* couch rectangles */ ]
  },
  "desk": {
    "space": [ /* desk rectangles */ ]
  }
}
```

**Key Characteristics:**
- `walls` object contains `interior` array with 145 wall rectangles
- Objects with `room: 1` are rooms (7 rooms total)
- Nested objects exist (teamMeetings.small, teamMeetings.round4, teamMeetings.square4)
- Each rectangle has `{x, y, width, height}` properties
- desk object does NOT have `room` property

---

## Critical File Changes

### Backend Files

#### `backend/requirements.txt`
```python
# Key upgraded dependencies:
supabase==2.24.0      # was 2.3.4
httpx==0.28.1         # was 0.25.2
pydantic==2.12.4      # was 2.5.3
websockets==15.0.1    # was 12.0
```

#### `backend/app/models/booking.py` (lines 50-51)
```python
# Changed from:
metadata = Column(JSONB, default=dict, nullable=False)

# To:
extra_data = Column(JSONB, default=dict, nullable=False)
```
**Same change applied to:** notification.py, achievement.py, audit.py

#### `backend/app/main.py` (lines 25-27)
```python
# Temporarily disabled database initialization
# await init_db()
# logger.info("Database initialized")
```

### Frontend Files

#### `frontend/src/types/index.ts`

**NEW INTERFACES ADDED:**

```typescript
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorObject {
  space?: Rectangle[];
  room?: number; // 1 means it's a room
  chairs?: Rectangle[];
  tables?: Rectangle[];
  couch?: Rectangle[];
  // Nested sub-objects (like teamMeetings.small, teamMeetings.round4)
  [key: string]: Rectangle[] | number | NestedRoomObject | undefined;
}

export interface NestedRoomObject {
  space?: Rectangle[];
  chairs?: Rectangle[];
  tables?: Rectangle[];
  [key: string]: Rectangle[] | undefined;
}

export interface WallsObject {
  interior: Rectangle[];
}

export interface FloorData {
  [objectName: string]: FloorObject;
}
```

#### `frontend/src/components/3d/FloorPlanViewer3D.tsx`

**COMPLETELY REWRITTEN** - Key changes:

**Room Color Palette (lines 15-24):**
```typescript
const ROOM_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#F8B500', // Orange
];
```

**Data Categorization (lines 67-89):**
```typescript
const { walls, rooms, objects } = useMemo(() => {
  if (!floorData) return { walls: null, rooms: [], objects: [] };

  let wallsData: any = null;
  const roomsList: Array<{ name: string; data: FloorData[string]; color: string }> = [];
  const objectsList: Array<{ name: string; data: FloorData[string] }> = [];

  let roomColorIndex = 0;
  Object.entries(floorData).forEach(([name, data]) => {
    if (name === 'walls') {
      wallsData = data;
    } else if (data.room === 1) {
      const color = ROOM_COLORS[roomColorIndex % ROOM_COLORS.length];
      roomsList.push({ name, data, color });
      roomColorIndex++;
    } else {
      objectsList.push({ name, data });
    }
  });

  return { walls: wallsData, rooms: roomsList, objects: objectsList };
}, [floorData]);
```

**NEW: WallsRenderer Component (lines 321-356):**
- Renders 145 interior walls as tall gray boxes (height = 4)
- Uses `walls.interior` array from floor_data.json
- Each wall is an extruded box, not a mesh

**NEW: RoomFloors Component (lines 366-408):**
- Renders room floor rectangles with unique colors
- Colored transparent planes on the floor
- Supports selection highlighting

**ObjectsRenderer Component (Updated):**
- Walls and tables use extruded boxes (not meshes)
- Wall height: 4 units
- Table height: 1.5 units
- Safety checks for undefined arrays: `if (!data.space || !Array.isArray(data.space) || data.space.length === 0) return null;`

**FilterPanel Component (lines 214-319):**
- Toggle individual rooms and objects
- Separate sections for Rooms and Objects
- Toggle all functionality
- Positioned on the right side of the viewer

#### `frontend/src/pages/FloorPlanPage.tsx`

**Updated to use new data structure:**
- Loads from `/floor_data.json` instead of `/out.json`
- Uses object names instead of indices
- Updated state management for FloorData type
- Shows room count and object count in header

#### `frontend/public/assets/meshes/mesh-config.json`

**Added wall configuration:**
```json
"wall": {
  "file": "wall",
  "scale": [1, 1, 1],
  "rotation": [0, 0, 0],
  "offset": [0, 1, 0],
  "color": "#BDC3C7"
}
```

---

## Issues Encountered and Resolutions

### 1. Backend Dependency Conflicts ✅ RESOLVED
**Error:** `TypeError: Client.__init__() got an unexpected keyword argument 'proxy'`
**Cause:** Supabase 2.3.4 incompatible with httpx versions
**Fix:** Upgraded supabase to 2.24.0, httpx to 0.28.1

### 2. Missing Pydantic Settings ✅ RESOLVED
**Error:** `ModuleNotFoundError: No module named 'pydantic_settings'`
**Fix:** Upgraded pydantic to 2.12.4

### 3. Websockets Module Error ✅ RESOLVED
**Error:** `ModuleNotFoundError: No module named 'websockets.asyncio'`
**Fix:** Upgraded websockets to 15.0.1

### 4. SQLAlchemy Reserved Column Name ✅ RESOLVED
**Error:** `Attribute name 'metadata' is reserved`
**Fix:** Renamed all `metadata` columns to `extra_data` in booking, notification, achievement, audit models

### 5. Database Foreign Key Type Mismatch ⚠️ BYPASSED
**Error:** `Key columns "room_id" and "id" are of incompatible types: uuid and bigint`
**Cause:** Existing Supabase tables have old schema
**Fix:** Temporarily disabled database initialization (line 26 in main.py)
**Status:** BYPASSED - backend runs but database not initialized

### 6. Frontend Blank Page JavaScript Crash ✅ RESOLVED
**Error:** `Cannot read properties of undefined (reading 'map')`
**Cause:** Some objects in floor_data.json had undefined `space` arrays
**Fix:** Added safety checks: `if (!data.space || !Array.isArray(data.space) || data.space.length === 0) return null;`

### 7. Missing Wall Mesh Configuration ✅ RESOLVED
**Error:** Console warning "No mesh config found for type: wall"
**Fix:** Added wall configuration to mesh-config.json

---

## Current Implementation Details

### 3D Visualization Features

**Coordinate System:**
- Scale factor: 0.05 (converts floor plan coordinates to 3D space)
- Y-axis is up (standard Three.js convention)
- Origin at center

**Rendering Strategy:**
- **Walls (145 total):** Tall gray extruded boxes (4 units high)
- **Room Floors (7 rooms):** Colored transparent rectangles on floor (unique color per room)
- **Tables:** Purple extruded boxes (1.5 units high)
- **Chairs/Desks:** 3D GLB mesh files (chair.glb, desk.glb)

**Interaction:**
- Click objects to select and show details
- OrbitControls for camera (rotate, pan, zoom)
- Filter panel to toggle visibility of individual rooms/objects

**Performance:**
- Uses useMemo for data categorization
- Conditional rendering based on visibility state
- Mesh loading with GLTFLoader

### TypeScript Type Safety

All floor plan data validated with TypeScript interfaces:
- `FloorData` - Top-level structure
- `FloorObject` - Individual objects with flexible properties
- `NestedRoomObject` - For nested structures like teamMeetings
- `WallsObject` - For walls.interior structure
- `Rectangle` - Basic rectangle shape

---

## Project File Structure

```
Smarthack_PinguWin/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry (DB init disabled line 26)
│   │   ├── models/
│   │   │   ├── booking.py              # MODIFIED: metadata → extra_data
│   │   │   ├── notification.py         # MODIFIED: metadata → extra_data
│   │   │   ├── achievement.py          # MODIFIED: metadata → extra_data
│   │   │   └── audit.py                # MODIFIED: metadata → extra_data
│   │   └── ...
│   ├── requirements.txt                # UPGRADED: supabase, httpx, pydantic, websockets
│   └── .env                            # Configured with Supabase credentials
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── 3d/
│   │   │       └── FloorPlanViewer3D.tsx  # COMPLETELY REWRITTEN
│   │   ├── pages/
│   │   │   └── FloorPlanPage.tsx       # UPDATED for new data structure
│   │   └── types/
│   │       └── index.ts                # ADDED new interfaces
│   └── public/
│       ├── floor_data.json             # NEW: Main data source
│       └── assets/
│           └── meshes/
│               ├── mesh-config.json    # ADDED wall configuration
│               ├── chair.glb           # NEW (renamed)
│               ├── table.glb           # NEW (renamed)
│               └── wall.glb            # NEW (renamed)
├── floor_data.json                     # NEW: Root copy
└── SESSION_CONTEXT.md                  # This file
```

---

## Git Status

**Current Branch:** main

**Modified Files:**
```
M  backend/requirements.txt
```

**Deleted Files (old meshes):**
```
D  frontend/public/assets/meshes/basic_low_poly_wall_with_a_baseboard.glb
D  frontend/public/assets/meshes/low_poly_pool_table.glb
D  frontend/public/assets/meshes/lowpoly_office_chair.glb
```

**Untracked Files:**
```
?? SESSION_CONTEXT.md
?? frontend/package-lock.json
?? frontend/public/assets/meshes/chair.glb
?? frontend/public/assets/meshes/table.glb
?? frontend/public/assets/meshes/wall.glb
```

**Recent Commits:**
```
555d58a - docs: Add mesh setup guide with file naming instructions
73e7741 - feat: Integrate out.json with automatic object classification and centered mesh positioning
0d2d4d2 - feat: Set up frontend with React, TypeScript, and 3D floor plan viewer
53080a3 - feat: Set up backend structure with FastAPI and database models
0f3524b - ceva
```

---

## Next Steps / Pending Tasks

### Immediate Verification Needed

1. **Test 3D Viewer** 🔴 PRIORITY
   - Visit http://localhost:5176/floor-plan
   - Verify all features work:
     - 145 interior walls render as gray boxes
     - 7 room floors with unique colors (Red, Teal, Blue, Salmon, Mint, Yellow, Purple, Orange)
     - Tables render as purple extruded boxes
     - Chairs and desks render as meshes
     - Filter panel toggles work
     - Object selection shows details

2. **Check Browser Console** 🔴 PRIORITY
   - Look for any JavaScript errors
   - Verify no "undefined" errors
   - Check for mesh loading warnings

### Backend Issues to Resolve

3. **Fix Database Schema** ⚠️ IMPORTANT
   - Resolve foreign key type mismatches
   - Either:
     - Drop and recreate Supabase tables with correct schema
     - Or run Alembic migrations to update existing schema
   - Re-enable database initialization in main.py line 26

4. **Test Database Connection**
   - Verify Supabase credentials work
   - Test database queries
   - Ensure tables are created correctly

### Feature Development (After Verification)

5. **Authentication System**
   - User registration endpoint
   - Login endpoint
   - JWT token generation
   - Protected route middleware

6. **Room/Desk Booking API**
   - Create booking endpoints
   - Implement conflict detection
   - Add Redis-based locking
   - Validation logic

7. **Booking UI**
   - Calendar integration
   - Booking form
   - Integration with 3D floor plan (click to book)

8. **User Management**
   - Roles system (admin, manager, user)
   - Permissions
   - Admin endpoints

---

## Quick Reference Commands

### Check Running Services

```bash
# Check if backend is running
curl http://127.0.0.1:8000/health

# Check if frontend is running
# Open browser to http://localhost:5176
```

### Backend Commands

```bash
# Navigate to backend
cd "C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin\backend"

# Run backend
uvicorn app.main:app --reload --port 8000

# Check dependencies
pip list | findstr supabase

# View logs from running background shell
# Use BashOutput tool with shell_id
```

### Frontend Commands

```bash
# Navigate to frontend
cd "C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin\frontend"

# Run frontend
npm run dev

# Build production
npm run build
```

### Analyze floor_data.json Structure

```bash
cd "C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin"

python -c "import json; data = json.load(open('floor_data.json')); print('Objects:', list(data.keys())); print('Rooms:', [k for k,v in data.items() if isinstance(v, dict) and v.get('room') == 1])"
```

---

## Important Notes

### Defensive Programming Pattern

**Applied throughout FloorPlanViewer3D.tsx:**
```typescript
// Always check arrays exist before mapping
if (!data.space || !Array.isArray(data.space) || data.space.length === 0) {
  return null;
}

// Safe mapping with optional chaining
{data.chairs?.map(...)}
{data.tables && Array.isArray(data.tables) && data.tables.map(...)}
```

### Mesh File Naming

**Current mesh files in frontend/public/assets/meshes/:**
- `chair.glb` - Office chair mesh
- `table.glb` - Table mesh
- `wall.glb` - Wall mesh
- `desk.glb` - Desk mesh (if exists)

**Configuration:** All mesh paths configured in `mesh-config.json`

### Data Loading

**Frontend loads floor plan data from:**
```typescript
fetch('/floor_data.json')  // Loads from frontend/public/floor_data.json
```

**Ensure file exists at:** `frontend/public/floor_data.json`

---

## Troubleshooting Guide

### 3D Viewer Shows Blank Page

1. **Check browser console** for errors
2. **Verify floor_data.json exists** at frontend/public/floor_data.json
3. **Check network tab** - ensure JSON loads successfully (200 status)
4. **Verify mesh files exist** in frontend/public/assets/meshes/
5. **Check FloorPlanViewer3D.tsx** has all safety checks

### Backend Won't Start

1. **Check .env file** exists with valid Supabase credentials
2. **Verify dependencies** are installed: `pip list | findstr supabase`
3. **Check port 8000** is not already in use
4. **Look for background shells** that might be running backend

### Objects Not Rendering

1. **Check filter panel** - ensure object visibility is enabled
2. **Check mesh configuration** in mesh-config.json
3. **Verify file names match** exactly (case-sensitive)
4. **Check browser console** for loading errors
5. **Verify data structure** matches TypeScript interfaces

### Rooms Not Colored

1. **Check ROOM_COLORS array** is defined (lines 15-24)
2. **Verify room.room === 1** in floor_data.json
3. **Check RoomFloors component** receives color prop
4. **Inspect material settings** - opacity should be 0.7-0.9

---

## Success Criteria

### 3D Viewer Working When:
- ✅ Page loads without errors
- ✅ 145 walls visible as gray boxes
- ✅ 7 room floors with different colors
- ✅ Tables appear as purple boxes
- ✅ Chairs/desks appear as meshes
- ✅ Filter panel toggles visibility
- ✅ Clicking objects shows details
- ✅ Camera controls work (rotate/pan/zoom)

### Backend Ready When:
- ✅ Server starts without errors
- ✅ http://127.0.0.1:8000/docs shows Swagger UI
- ✅ Database initialization succeeds
- ✅ Health check endpoint responds

### Ready for Development When:
- ✅ Both frontend and backend running
- ✅ 3D viewer fully functional
- ✅ Database schema created
- ✅ No console errors

---

## Environment Details

- **Working Directory:** `C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin`
- **Platform:** Windows (win32)
- **Git Repository:** Yes (main branch)
- **Backend URL:** http://127.0.0.1:8000
- **Frontend URL:** http://localhost:5176
- **Database:** Supabase (xgolddsaytgxahuulcwx.supabase.co)

---

## Conversation Summary

This session involved:
1. Checking Supabase credentials (backend had issues)
2. Fixing multiple backend dependency conflicts
3. Resolving SQLAlchemy reserved column name errors
4. Complete migration from out.json to floor_data.json
5. Total rewrite of 3D floor plan viewer
6. Implementation of recursive data structure handling
7. Adding filter panel for selective rendering
8. Implementing unique room colors
9. Making walls/tables extruded boxes instead of meshes
10. Adding comprehensive safety checks throughout

**Current Status:** Both frontend and backend are running. Database initialization is disabled due to schema issues. 3D viewer has been completely rewritten to support the new floor_data.json structure with 145 walls, 7 rooms with unique colors, and proper handling of nested objects.

---

**END OF SESSION CONTEXT**

To resume work in next session:
1. Read this file for complete context
2. Verify 3D viewer works at http://localhost:5176/floor-plan
3. Check for any console errors or visual issues
4. Proceed with backend database schema fixes if needed
5. Continue with authentication and booking feature development
