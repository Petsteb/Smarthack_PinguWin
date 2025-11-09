# SmartHack PinguWin - Session Context

**Last Updated:** 2025-11-09
**Project:** Room and Desk Booking System with 3D Floor Plan Visualization

---

## Project Overview

A web application for booking rooms and desks with an interactive 3D floor plan viewer:
- **Frontend:** React + TypeScript + Three.js (@react-three/fiber, @react-three/drei)
- **Backend:** FastAPI + Supabase + Redis + Celery
- **Database:** Supabase PostgreSQL
- **3D Rendering:** All objects rendered as extruded box geometries (no mesh files loaded)

---

## Current Application State

### Key Features Implemented ✅

1. **Interactive 3D floor plan viewer** with click and hover support
2. **Individual desk selection** - Each desk in a group has unique ID (e.g., "desks1-0", "desks1-1")
3. **Room splitting logic** for complex multi-space rooms
4. **Coordinate-based furniture filtering** - Only renders objects within room boundaries
5. **Filter panel** with individual toggles for all rooms and objects
6. **Event propagation control** - Only frontmost object responds to clicks/hovers
7. **Non-interactive elements** - Chairs and walls don't respond to hover/click
8. **Separate toggles** for interior and exterior walls
9. **Object details sidebar** - Shows space rectangles, furniture counts, and booking options

---

## Floor Plan Data Structure

### File: `floor_data.json`

**Location:** `frontend/public/floor_data.json`

**Structure:**
```json
{
  "objectName": {
    "space": [
      { "x": float, "y": float, "width": float, "height": float }
    ],
    "room": 0 | 1,  // 1 = room, 0 = object
    "chairs": [
      { "x": float, "y": float, "width": float, "height": float }
    ],
    "tables": [
      { "x": float, "y": float, "width": float, "height": float }
    ]
  },
  "walls": {
    "interior": [
      { "x": float, "y": float, "width": float, "height": float }
    ],
    "exterior": [
      { "x": float, "y": float, "width": float, "height": float }
    ]
  },
  "teamMeetings": {
    "small": {
      "space": [...],  // 4 rectangles
      "chairs": [...],
      "tables": [...]
    },
    "round4": {
      "space": [...],  // 1 rectangle
      "chairs": [...],
      "tables": [...]
    },
    "square4": {
      "space": [...],  // 3 rectangles
      "chairs": [...],
      "tables": [...]
    }
  },
  "managementRoom": {
    "space": [...],  // 3 rectangles
    "chairs": [...],
    "tables": [...]
  }
}
```

**Key Objects:**
- **Rooms:** reception, trainingRooms, teamMeetings (split into 8), managementRoom (split into 3), phoneBooths, kitchen
- **Desk Groups:** desks1, desks2, desks3, desks4, desks5
- **Walls:** interior, exterior (separate arrays)

---

## Critical File Details

### **FloorPlanViewer3D.tsx**
`frontend/src/components/3d/FloorPlanViewer3D.tsx`

**Purpose:** Main 3D viewer component - handles all rendering, filtering, interactions

#### Key State Variables
```typescript
visibleObjects: Set<string>      // Controls which objects are visible
showWalls: boolean                // Interior walls visibility
showExteriorWalls: boolean        // Exterior walls visibility
hoveredObject: string | null      // Currently hovered object
selectedObject: string | null     // Currently selected object (from parent)
```

#### Critical Functions

**1. isWithinSpace(obj, space)** - Lines 70-80
Checks if object center point falls within space boundaries for coordinate-based filtering:
```typescript
const objCenterX = obj.x + obj.width / 2;
const objCenterY = obj.y + obj.height / 2;
return (
  objCenterX >= space.x &&
  objCenterX <= space.x + space.width &&
  objCenterY >= space.y &&
  objCenterY <= space.y + space.height
);
```

**2. Room Categorization Logic** - Lines 82-167
Splits multi-space rooms into individual rooms:

**teamMeetings → 8 rooms:**
- `teamMeetings-small-0` through `teamMeetings-small-3` (4 rooms from small.space)
- `teamMeetings-round4` (1 room from round4.space)
- `teamMeetings-square4-0` through `teamMeetings-square4-2` (3 rooms from square4.space)

**managementRoom → 3 rooms:**
- `managementRoom-0`, `managementRoom-1`, `managementRoom-2`

Each split room:
- Gets one space rectangle from the original array
- Filters furniture (chairs/tables) by coordinates using `isWithinSpace()`
- Only renders objects physically within that room's boundaries

**3. toggleAllOfType(names, show)** - Lines 186-199
Updates `visibleObjects` Set for multiple items at once (used by Show/Hide All buttons)

**4. FloorPlanObjects Component** - Lines 538-825
Renders all 3D objects based on type:
- **Individual Desk IDs:** Pattern `${name}-${index}` (e.g., "desks1-0", "desks1-1")
- **Event Handlers:** All use `e.stopPropagation()` to prevent multi-object selection
- **Chairs:** No event handlers (non-interactive) - Lines 553-565
- **Walls:** `stopPropagation()` only to block raycasting - Lines 485-496

**5. WallsRenderer Component** - Lines 454-507
Renders both interior and exterior walls:
```typescript
function WallsRenderer({ walls, meshConfig, showInterior, showExterior }) {
  return (
    <group>
      {showInterior && walls.interior && renderWalls(walls.interior, 'wall-interior')}
      {showExterior && walls.exterior && renderWalls(walls.exterior, 'wall-exterior')}
    </group>
  );
}
```

#### Filter Panel Structure - Lines 270-451
- **Rooms Section:** Individual toggles for all rooms with color indicators
- **Objects Section:** Desks, tables, interior walls, exterior walls
- **Show All / Hide All:** Calls `toggleAllOfType()` to update `visibleObjects` Set

#### Visual Feedback
- **Hover:** `emissiveIntensity: 0.15`
- **Selected:** `emissiveIntensity: 0.3`
- **Chairs/Walls:** No emissive effects (non-interactive)

---

### **FloorPlanPage.tsx**
`frontend/src/pages/FloorPlanPage.tsx`

**Purpose:** Parent component managing state and displaying object details sidebar

#### Key Function: getSelectedObjectData() - Lines 63-164

Resolves selected object ID to actual data. Handles multiple patterns:

1. **Direct lookup:** `floorData[selectedObject]`
2. **Individual desks:** `desks1-0` → lookup `desks1`
3. **Management rooms:** `managementRoom-0` → filter space[0] + furniture by coordinates
4. **Team meetings:** `teamMeetings-small-0` → filter nested data

Returns coordinate-filtered furniture for split rooms using `isWithinSpace()` helper.

#### UI Components
- **Header:** Room/object counts
- **3D Viewer:** FloorPlanViewer3D component
- **Sidebar:** Absolute positioned (right side, z-20):
  - Object name and type
  - Space rectangles with coordinates
  - Furniture counts (chairs, tables)
  - Booking buttons (for rooms and desks)

---

### **mesh-config.json**
`frontend/public/assets/meshes/mesh-config.json`

**Purpose:** Configuration for object rendering (currently box geometries, prepared for mesh loading)

```json
{
  "meshes": {
    "room": { "color": "#4ECDC4", "opacity": 0.2 },
    "chair": { "color": "#FFD93D" },
    "desk": { "color": "#FF6B6B" },
    "table": { "color": "#9B59B6" },
    "wall": { "color": "#BDC3C7" },
    "door": { "color": "#3498DB" },
    "generic": { "color": "#95A5A6" }
  },
  "settings": {
    "autoRotation": false,
    "enableShadows": true,
    "ambientLightIntensity": 0.6,
    "directionalLightIntensity": 0.8,
    "backgroundColor": "#f0f0f0",
    "gridHelper": true,
    "axisHelper": false
  }
}
```

---

## Key Implementation Details

### 1. Individual Desk IDs
Each desk in a desk group gets a unique identifier:
- **Pattern:** `${groupName}-${index}`
- **Example:** `desks1-0`, `desks1-1`, `desks1-2`
- **Purpose:** Allows independent hover/click states
- **Resolution:** FloorPlanPage resolves these IDs back to group data using regex pattern matching

### 2. Room Splitting Logic
Two rooms have multiple space rectangles split into individual rooms:

**teamMeetings (8 total):**
```
teamMeetings.small.space (4 rects) → teamMeetings-small-0, teamMeetings-small-1, teamMeetings-small-2, teamMeetings-small-3
teamMeetings.round4.space (1 rect) → teamMeetings-round4
teamMeetings.square4.space (3 rects) → teamMeetings-square4-0, teamMeetings-square4-1, teamMeetings-square4-2
```

**managementRoom (3 total):**
```
managementRoom.space (3 rects) → managementRoom-0, managementRoom-1, managementRoom-2
```

### 3. Coordinate-Based Furniture Filtering
When splitting rooms, furniture (chairs/tables) is filtered based on spatial coordinates:
1. Calculate object center: `(x + width/2, y + height/2)`
2. Check if center falls within space rectangle boundaries
3. Only render furniture that physically belongs to that specific room

Implementation in both FloorPlanViewer3D.tsx and FloorPlanPage.tsx using `isWithinSpace()` helper.

### 4. Event Propagation Control
All interactive meshes use `e.stopPropagation()`:
- Prevents multiple objects from being highlighted simultaneously
- Ensures only the frontmost object under the mouse cursor responds
- Applied to: `onClick`, `onPointerOver`, `onPointerOut`

**Non-Interactive Elements:**
- **Chairs:** No event handlers at all
- **Walls:** Only `stopPropagation()` to block raycasting, no actual handlers

### 5. Visibility Control
**Single source of truth:** `visibleObjects` Set

- "Show All" / "Hide All" buttons update the entire Set via `toggleAllOfType()`
- Individual toggles add/remove from Set
- No conflicting master switches

**Previous bug (FIXED):**
- Old pattern: `showRooms && visibleObjects.has(name)` created conflicting states
- "Hide All" set `showRooms = false` but didn't update `visibleObjects`
- Individual toggles couldn't override master state

### 6. Rendering Details
- **Scale:** 0.05 applied to all coordinates
- **All objects:** Rendered as box geometries with dimensions from floor_data.json
- **Height calculation:** `Math.max(rect.width, rect.height) * scale * 0.5`
- **Center calculation:** `(x + width/2) * scale`, `(y + height/2) * scale`

---

## TypeScript Interfaces

### FloorData
```typescript
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FloorObject {
  space?: Rectangle[];
  room?: 0 | 1;
  chairs?: Rectangle[];
  tables?: Rectangle[];
  [key: string]: any;  // For nested objects
}

interface FloorData {
  [objectName: string]: FloorObject | {
    interior?: Rectangle[];
    exterior?: Rectangle[];
  };
}
```

---

## Recent Fixes Applied

### Fix 1: Room Toggle Bug ✅
**Problem:** "Hide All" prevented individual rooms from showing; "Show All" only restored previous toggle states

**Root Cause:**
- "Show All/Hide All" button only toggled `showRooms` state
- Didn't update `visibleObjects` Set
- Individual room visibility controlled by `visibleObjects.has(name) && showRooms`
- Created conflicting states

**Solution:**
- Made "Show All/Hide All" call `toggleAllOfType()` to update `visibleObjects`
- Removed master `showRooms` check from rendering (rooms always attempt to render if in `visibleObjects`)
- Removed `&& showRooms` from individual button styling logic

**Files Modified:** FloorPlanViewer3D.tsx lines 336-388

---

### Fix 2: Multiple Object Highlighting ✅
**Problem:** Clicking an object highlighted all objects along the mouse ray

**Root Cause:** Three.js raycasting hits all objects along the ray; without event propagation control, all objects receive events

**Solution:** Added `e.stopPropagation()` to all interactive meshes:
- onClick handlers
- onPointerOver handlers
- onPointerOut handlers

**Files Modified:** FloorPlanViewer3D.tsx throughout rendering components

---

### Fix 3: Individual Desk Selection Error ✅
**Problem:** Clicking "desks1-0" caused "Cannot read properties of undefined" error

**Root Cause:**
- `selectedObject` was "desks1-0"
- `floorData` only had "desks1" key
- Code tried `floorData["desks1-0"]` which doesn't exist

**Solution:** Created `getSelectedObjectData()` function with pattern matching:
1. Try direct lookup first
2. Check for managementRoom-{index} pattern
3. Check for teamMeetings-{subKey}-{index} pattern
4. Check for generic {name}-{index} pattern using regex

**Files Modified:** FloorPlanPage.tsx lines 63-164

---

## Recent Changes Timeline

### Session 1: Individual Desk Interaction
- Modified FloorPlanViewer3D.tsx to create unique IDs for each desk
- Pattern: `${name}-${index}`
- Each desk now has independent hover and selection states
- **Location:** Lines 663-748 in FloorPlanObjects component

### Session 2: Training Room Toggles
- Created individual toggles for training rooms
- **User feedback:** "put all of the rooms in rooms category of filters, do not make a different section for the training rooms and put the walls in the object category"
- Consolidated all rooms back into one section
- Moved walls to objects category

### Session 3: Team Meeting Room Splitting
- Split teamMeetings: small (4 rooms), round4 (1 room), square4 (3 rooms)
- Implemented coordinate-based furniture filtering
- Created individual rooms with unique IDs

### Session 4: Management Room Splitting
- Split managementRoom into 3 individual rooms
- Applied same coordinate-based filtering logic

### Session 5: Room Toggle Fix
- Fixed broken "Hide All" / "Show All" functionality
- Updated to use `toggleAllOfType()` instead of master state

### Session 6: Event Propagation
- Added `stopPropagation()` to prevent multi-object selection
- Only frontmost object now responds to interactions

### Session 7: Disable Chair/Wall Interactions
- Removed all event handlers from chairs (non-interactive)
- Added `stopPropagation()` to walls (block raycasting only)

### Session 8: Exterior Walls Toggle
- Added separate toggle for exterior walls
- Updated WallsRenderer to handle both interior and exterior
- Filter panel now shows both wall toggles

---

## Project File Structure

```
Smarthack_PinguWin/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── booking.py
│   │   │   ├── notification.py
│   │   │   ├── achievement.py
│   │   │   └── audit.py
│   │   └── ...
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── 3d/
│   │   │       └── FloorPlanViewer3D.tsx    # Main 3D viewer
│   │   ├── pages/
│   │   │   └── FloorPlanPage.tsx            # Parent page with sidebar
│   │   └── types/
│   │       └── index.ts                     # TypeScript interfaces
│   └── public/
│       ├── floor_data.json                  # Main data source
│       └── assets/
│           └── meshes/
│               └── mesh-config.json         # Rendering config
└── SESSION_CONTEXT.md                       # This file
```

---

## Git Status

**Current Branch:** main

**Modified Files:**
```
M  .claude/settings.local.json
M  SESSION_CONTEXT.md
M  backend/app/main.py
M  frontend/public/assets/meshes/mesh-config.json
M  frontend/src/components/3d/FloorPlanViewer3D.tsx
M  frontend/src/pages/FloorPlanPage.tsx
M  frontend/src/types/index.ts
```

**Untracked:**
```
?? nul
```

**Recent Commits:**
```
fb79a6b - temp
555d58a - docs: Add mesh setup guide with file naming instructions
73e7741 - feat: Integrate out.json with automatic object classification and centered mesh positioning
0d2d4d2 - feat: Set up frontend with React, TypeScript, and 3D floor plan viewer
53080a3 - feat: Set up backend structure with FastAPI and database models
```

---

## Development Commands

### Frontend
```bash
# Navigate to frontend
cd "C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin\frontend"

# Run dev server
npm run dev

# Build production
npm run build
```

### Backend
```bash
# Navigate to backend
cd "C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin\backend"

# Run server
uvicorn app.main:app --reload

# Check dependencies
pip list | findstr supabase
```

---

## Important Notes

### 1. All Objects Are Box Geometries
Despite mesh-config.json structure, **no actual .glb/.obj mesh files are loaded**. All objects rendered as extruded box geometries.

### 2. Coordinates Are 2D
floor_data.json uses x, y, width, height. Converted to 3D with calculated height based on object type.

### 3. Filter Panel Inside 3D Canvas
The filter panel is rendered as part of the Three.js canvas using HTML overlay, not a separate HTML sidebar.

### 4. Object Details Sidebar Is Absolute Positioned
Overlays on right side (z-20) when object selected. Part of FloorPlanPage.tsx, not the 3D viewer.

### 5. Defensive Programming Applied
All array operations include safety checks:
```typescript
if (!data.space || !Array.isArray(data.space) || data.space.length === 0) {
  return null;
}
```

---

## Pending Tasks / Next Steps

**No pending tasks.** All user requests completed:
- ✅ Individual desk hover/click
- ✅ Training room toggles (consolidated into Rooms section)
- ✅ Team meeting room splitting (4+1+3)
- ✅ Coordinate-based furniture filtering
- ✅ Management room splitting (3 rooms)
- ✅ Fixed room toggle functionality
- ✅ Event propagation control
- ✅ Disabled chair/wall interactions
- ✅ Exterior walls toggle

### Potential Future Enhancements
1. Backend integration for real booking functionality
2. User authentication and session management
3. Real-time availability updates
4. Calendar integration for room/desk scheduling
5. User preferences and favorite workspaces
6. Analytics dashboard for space utilization
7. Mobile responsive design
8. Accessibility improvements

---

## Environment Details

- **Working Directory:** `C:\Users\petst\OneDrive\Desktop\SH PinguWin\Smarthack_PinguWin`
- **Platform:** Windows (win32)
- **Git Repository:** Yes (main branch)
- **Frontend URL:** http://localhost:5176
- **Backend URL:** http://127.0.0.1:8000
- **Database:** Supabase

---

## Quick Reference: Code Locations

### Individual Desk Rendering
**File:** FloorPlanViewer3D.tsx
**Lines:** 663-748
**Pattern:** `${name}-${index}`

### Room Splitting Logic
**File:** FloorPlanViewer3D.tsx
**Lines:** 82-167
**Function:** isWithinSpace() at lines 70-80

### Toggle All Functionality
**File:** FloorPlanViewer3D.tsx
**Lines:** 186-199, 336-388
**Function:** toggleAllOfType()

### Selected Object Resolution
**File:** FloorPlanPage.tsx
**Lines:** 63-164
**Function:** getSelectedObjectData()

### Wall Rendering
**File:** FloorPlanViewer3D.tsx
**Lines:** 454-507
**Component:** WallsRenderer

### Filter Panel
**File:** FloorPlanViewer3D.tsx
**Lines:** 270-451
**Sections:** Rooms, Objects

---

## Success Criteria

### 3D Viewer Working When:
- ✅ Page loads without errors
- ✅ Walls visible as gray/colored boxes
- ✅ Room floors with different colors
- ✅ Tables appear as purple boxes
- ✅ Individual desks independently selectable
- ✅ Filter panel toggles visibility correctly
- ✅ Clicking objects shows details sidebar
- ✅ Camera controls work (rotate/pan/zoom)
- ✅ Only frontmost object highlights on hover
- ✅ Chairs and walls non-interactive
- ✅ Interior and exterior walls independently toggleable

---

**END OF SESSION CONTEXT**

To resume work in next session:
1. Read this file for complete context
2. All current features are fully implemented and working
3. Ready for new feature requests or enhancements
4. Backend integration pending for booking functionality
