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

**3D Viewer - All completed:**
- ✅ Individual desk hover/click
- ✅ Training room toggles (consolidated into Rooms section)
- ✅ Team meeting room splitting (4+1+3)
- ✅ Coordinate-based furniture filtering
- ✅ Management room splitting (3 rooms)
- ✅ Fixed room toggle functionality
- ✅ Event propagation control
- ✅ Disabled chair/wall interactions
- ✅ Exterior walls toggle

**User Authentication System - Recently Completed:**
- ✅ Backend authentication API (register, login, JWT tokens)
- ✅ Frontend auth context and protected routes
- ✅ Login/Register pages
- ✅ Profile page with editing
- ✅ Navigation with user menu
- ⚠️ **PENDING:** Database migration must be run (see section below)

### Immediate Next Step: Database Migration Required ⚠️

**File:** `backend/add_user_columns.sql`

**Action Required:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `backend/add_user_columns.sql`
3. Execute the migration
4. Verify: `SELECT * FROM users LIMIT 1;`
5. Restart backend server
6. Test registration at http://localhost:5173/register

**Why Required:** New columns (username, full_name, gamification fields, etc.) need to be added to existing users table.

### Potential Future Enhancements
1. ~~Backend integration for real booking functionality~~ (In progress)
2. ~~User authentication and session management~~ (✅ Completed)
3. Real-time availability updates
4. Calendar integration for room/desk scheduling
5. User preferences and favorite workspaces
6. Analytics dashboard for space utilization
7. Mobile responsive design
8. Accessibility improvements
9. Email verification and password reset emails
10. Room and desk booking endpoints
11. Booking conflict detection
12. Gamification features (achievements, leaderboard)

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

## User Authentication System Implementation

**Implementation Date:** 2025-11-09
**Status:** Code Complete - Database Migration Pending

### Overview

Implemented complete full-stack user authentication and profile management system using JWT tokens, integrating with existing Supabase database schema.

---

### Backend Implementation

#### 1. Database Schema Adaptation ✅

**Challenge:** Existing database uses BigInteger `user_id` (auto-increment), but modern FastAPI patterns typically use UUID.

**Solution:** Adapted User model to existing schema while maintaining backward compatibility.

**File:** `backend/app/models/user.py`

```python
class User(Base):
    __tablename__ = "users"

    # Primary fields (from existing schema)
    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text, nullable=False)  # Original field
    hashed_password = Column(Text, nullable=False)
    role = Column(Text, nullable=False, server_default='employee')

    # New optional fields (added via migration)
    username = Column(Text, unique=True, nullable=True)
    full_name = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    department = Column(Text, nullable=True)
    job_title = Column(Text, nullable=True)

    # Status fields
    is_active = Column(Boolean, nullable=False, server_default='true')
    is_verified = Column(Boolean, nullable=False, server_default='false')

    # Gamification fields
    total_points = Column(Integer, nullable=False, server_default='0')
    level = Column(Integer, nullable=False, server_default='1')
    tokens = Column(Integer, nullable=False, server_default='0')

    # Preferences and timestamps
    preferences = Column(JSONB, nullable=False, server_default='{}')
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('NOW()'))
    last_login = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    @property
    def id(self):
        """Alias for user_id for API compatibility"""
        return self.user_id
```

**Key Points:**
- `user_id` is the actual primary key
- `id` property provides compatibility alias
- `name` field is required (from original schema)
- `full_name` is optional new field
- All new fields are nullable to avoid breaking existing data

#### 2. Authentication Routes ✅

**File:** `backend/app/routes/auth.py`

**Endpoints:**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Get JWT tokens (access + refresh)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (client-side token removal)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email/{token}` - Email verification (TODO)

**Key Features:**
- Bcrypt password hashing
- JWT tokens (access: 30min, refresh: 7 days)
- Password validation (min 8 chars, uppercase, lowercase, digit)
- Email uniqueness validation
- Username uniqueness validation (if provided)
- Returns token in DEBUG mode for password reset (dev only)

#### 3. User Management Routes ✅

**File:** `backend/app/routes/users.py`

**User Endpoints:**
- `GET /api/users/me` - Get full profile
- `PUT /api/users/me` - Update own profile
- `GET /api/users/me/stats` - Get own statistics
- `GET /api/users/{user_id}` - Get user by ID
- `GET /api/users/{user_id}/stats` - Get user stats

**Manager/Admin Endpoints:**
- `GET /api/users/` - List all users (paginated)
- `PUT /api/users/{user_id}` - Admin update user
- `DELETE /api/users/{user_id}` - Soft delete user
- `POST /api/users/{user_id}/activate` - Activate user
- `POST /api/users/{user_id}/deactivate` - Deactivate user
- `POST /api/users/{user_id}/verify` - Manually verify email
- `POST /api/users/{user_id}/points` - Update points
- `POST /api/users/{user_id}/tokens` - Update tokens

**Access Control:**
- Users can view/edit own data
- Managers can view all users
- Admins can modify all users
- Protection against self-deletion/deactivation

#### 4. Authentication Middleware ✅

**File:** `backend/app/middleware/auth.py`

**Dependencies:**
- `get_current_user` - Extract user from Bearer token
- `get_current_active_user` - Ensure user is active
- `get_current_verified_user` - Ensure email verified
- `get_current_admin` - Admin-only access
- `get_current_manager` - Manager/Admin access
- `get_current_user_optional` - Optional auth (returns None if no token)

**Utility Functions:**
- `has_permission(user, role)` - Check role permission
- `check_user_permission(user, target_user_id)` - Check data access permission

**Token Verification Flow:**
1. Extract Bearer token from Authorization header
2. Verify JWT signature and expiry
3. Extract user_id from token payload
4. Load user from database
5. Check active status
6. Return User object

#### 5. User Service Layer ✅

**File:** `backend/app/services/user.py`

**Methods:**
- `create_user()` - Create new user with hashed password
- `authenticate_user()` - Verify email/password
- `get_user_by_id()` - Get user by ID
- `get_user_by_email()` - Get user by email
- `get_user_by_username()` - Get user by username
- `get_users()` - List users with filters (role, active status)
- `update_user()` - Update user profile
- `admin_update_user()` - Admin update (includes role, status)
- `delete_user()` - Soft delete (set deleted_at)
- `set_user_active_status()` - Activate/deactivate
- `verify_user_email()` - Mark email as verified
- `change_password()` - Change password (verify old password)
- `reset_password()` - Reset password (no old password required)
- `update_user_points()` - Add/remove points
- `update_user_tokens()` - Add/remove tokens
- `get_user_stats()` - Get booking statistics (TODO: implement)

**All methods use `int` for user_id, not UUID**

#### 6. Pydantic Schemas ✅

**File:** `backend/app/schemas/user.py`

**Authentication Schemas:**
- `UserRegister` - Registration with password validation
- `UserLogin` - Email/password login
- `TokenResponse` - JWT tokens response
- `TokenRefresh` - Refresh token request
- `PasswordChange` - Change password
- `PasswordReset` - Request password reset
- `PasswordResetConfirm` - Reset with token

**User Schemas:**
- `UserBase` - Base fields (email, username, full_name)
- `UserCreate` - Internal user creation
- `UserUpdate` - Profile update
- `UserResponse` - User data response (id: int, role: str)
- `UserProfile` - Extended profile with supabase_user_id
- `UserStats` - User statistics
- `UserAdminUpdate` - Admin update (includes role, status, points)
- `UserListResponse` - Paginated user list

**Key Type Changes:**
- `id: int` (was UUID)
- `role: str` (was UserRole enum in responses)
- All schemas use `from_attributes = True` for SQLAlchemy compatibility

#### 7. JWT Utilities ✅

**File:** `backend/app/utils/auth.py`

**Functions:**
- `verify_password()` - Verify password against hash
- `hash_password()` - Hash password with bcrypt
- `create_access_token()` - Create access token (30min)
- `create_refresh_token()` - Create refresh token (7 days)
- `verify_access_token()` - Verify and decode access token
- `verify_refresh_token()` - Verify and decode refresh token
- `create_password_reset_token()` - Create reset token (1 hour)
- `verify_password_reset_token()` - Verify reset token

**Token Payload:**
```python
{
    "sub": str(user.id),  # User ID
    "email": user.email,
    "role": user.role.value,
    "exp": expiry_timestamp
}
```

#### 8. Database Migration ⚠️ PENDING

**File:** `backend/add_user_columns.sql`

**Purpose:** Add new columns to existing users table without breaking existing data

**Operations:**
1. Add new columns (all nullable)
2. Update role constraint to include 'user' and 'manager'
3. Create performance indexes
4. Sync name → full_name for existing users
5. Map 'employee' → 'user' role for existing users

**Must Execute Before Testing:**
```sql
-- In Supabase SQL Editor
-- Copy and run entire file
```

#### 9. Main App Configuration ✅

**File:** `backend/app/main.py`

**Changes:**
- Registered auth router: `/api/auth`
- Registered users router: `/api/users`
- CORS already configured: `http://localhost:5173`
- Database initialization disabled (using existing database)

---

### Frontend Implementation

#### 1. API Service Layer ✅

**File:** `frontend/src/services/api.ts`

**Axios Instance with Interceptors:**
```typescript
// Request interceptor - inject token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - auto refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                const newTokens = await refreshAccessToken(refreshToken);
                // Retry original request with new token
            }
        }
        return Promise.reject(error);
    }
);
```

**File:** `frontend/src/services/auth.ts`

**Auth API Methods:**
- `login(email, password)` - Login and store tokens
- `register(userData)` - Create account
- `logout()` - Clear tokens
- `getCurrentUser()` - Get current user info
- `updateProfile(data)` - Update profile
- `changePassword(current, new)` - Change password
- `forgotPassword(email)` - Request reset
- `resetPassword(token, password)` - Reset password
- `getUserStats()` - Get user statistics
- `refreshToken(refreshToken)` - Refresh access token

#### 2. Authentication Context ✅

**File:** `frontend/src/contexts/AuthContext.tsx`

**State:**
```typescript
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email, password) => Promise<void>;
    register: (userData) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}
```

**Features:**
- Global user state
- Token storage in localStorage
- Auto-refresh user on mount
- Login/logout/register methods
- Loading states for async operations
- Error handling

**Usage:**
```typescript
const { user, login, logout, loading } = useAuth();
```

#### 3. Protected Routes ✅

**File:** `frontend/src/components/auth/ProtectedRoute.tsx`

**Features:**
- Redirect to login if not authenticated
- Role-based access control
- Loading state while checking auth
- Preserves intended destination in redirect

**Usage:**
```typescript
<Route path="/profile" element={
    <ProtectedRoute>
        <ProfilePage />
    </ProtectedRoute>
} />

<Route path="/admin" element={
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminPage />
    </ProtectedRoute>
} />
```

#### 4. Navigation Component ✅

**File:** `frontend/src/components/layout/Navigation.tsx`

**Features:**
- Conditional rendering based on auth state
- User dropdown menu (Profile, Settings, Logout)
- Login/Signup buttons for guests
- Active link highlighting
- Responsive design

**Menu Items:**
- Home
- Floor Plan (protected)
- Profile (authenticated users)
- Settings (authenticated users)
- Admin (admin only)
- Login/Signup (guests)
- Logout (authenticated users)

#### 5. Login Page ✅

**File:** `frontend/src/pages/LoginPage.tsx`

**Features:**
- Email/password form
- Form validation
- Error display
- Loading states
- Redirect to floor plan after login
- Link to registration page

**Validation:**
- Email format
- Password required
- Error messages from API

#### 6. Registration Page ✅

**File:** `frontend/src/pages/RegisterPage.tsx`

**Features:**
- Full registration form
- Password strength indicator
- Real-time validation
- Error display
- Loading states
- Redirect to floor plan after registration
- Link to login page

**Form Fields:**
- Email (required)
- Password (required, validated)
- Full Name (optional)
- Username (optional)

**Password Validation:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- Visual strength indicator (weak/medium/strong)

#### 7. Profile Page ✅

**File:** `frontend/src/pages/ProfilePage.tsx`

**Features:**
- View user profile
- Edit profile form
- User statistics display
- Avatar display (if set)
- Points, level, tokens display
- Save changes functionality
- Error handling
- Success messages

**Sections:**
1. **Profile Info:**
   - Email (read-only)
   - Username
   - Full Name
   - Bio
   - Phone
   - Department
   - Job Title

2. **Gamification:**
   - Total Points
   - Level
   - Tokens

3. **Statistics:**
   - Total Bookings
   - Active Bookings
   - Completed Bookings
   - Total Hours Booked

#### 8. App Integration ✅

**File:** `frontend/src/main.tsx`
```typescript
<AuthProvider>
    <App />
</AuthProvider>
```

**File:** `frontend/src/App.tsx`
```typescript
<Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/floor-plan" element={
        <ProtectedRoute><FloorPlanPage /></ProtectedRoute>
    } />
    <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
    } />
</Routes>
```

---

### Technical Decisions

#### 1. Primary Key Type: BigInteger vs UUID
**Decision:** Use BigInteger (auto-increment)
**Reason:** Match existing database schema
**Implementation:** Added `id` property alias for compatibility

#### 2. Role Storage: Text vs Enum
**Decision:** Store as TEXT in database, use enum in code
**Reason:** Existing schema uses TEXT with CHECK constraint
**Implementation:** Convert enum to string for storage, string to enum for validation

#### 3. Token Storage: localStorage vs Cookies
**Decision:** localStorage for development
**Reason:** Simpler implementation, good for SPA
**Production Consideration:** Consider httpOnly cookies for enhanced security

#### 4. Token Refresh Strategy
**Decision:** Axios interceptor with automatic refresh
**Reason:** Seamless UX, no manual token management
**Implementation:** Intercept 401 errors, refresh token, retry request

#### 5. Password Reset: Email vs Token Return
**Decision:** Return token in DEBUG mode, email in production
**Reason:** Easier testing without email server
**Implementation:** Conditional logic based on `settings.DEBUG`

---

### Error Fixes Applied

#### Fix 1: FastAPI Dependency Injection ✅
**Error:** `Invalid args for response field! AsyncSession is not a valid Pydantic field type`

**Cause:** Missing `Depends()` annotation in `get_user_service`

**Fix:**
```python
# Before:
def get_user_service(db: AsyncSession) -> UserService:

# After:
def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
```

**Location:** `backend/app/services/user.py:180`

#### Fix 2: Database Schema Mismatch ✅
**Error:** `column users.id does not exist`

**Cause:** Model used UUID `id`, database has BigInteger `user_id`

**Fix:**
1. Rewrote User model to use `user_id` as primary key
2. Added `id` property as alias
3. Changed all UUID type hints to `int`
4. Updated all service methods
5. Updated all route parameters
6. Updated all schemas
7. Created migration script for new columns

**Files Modified:**
- `backend/app/models/user.py`
- `backend/app/services/user.py`
- `backend/app/routes/auth.py`
- `backend/app/routes/users.py`
- `backend/app/middleware/auth.py`
- `backend/app/schemas/user.py`

#### Fix 3: CORS Already Configured ✅
**Status:** CORS already configured in `.env`
**Value:** `CORS_ORIGINS=http://localhost:5173`
**No changes needed**

---

### Environment Variables

#### Backend `.env`
```env
# Required
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:pass@host/db

# Optional (have defaults)
CORS_ORIGINS=http://localhost:5173
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
```

---

### File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── user.py                    # User model (user_id primary key)
│   ├── schemas/
│   │   └── user.py                    # Pydantic schemas
│   ├── services/
│   │   └── user.py                    # UserService
│   ├── routes/
│   │   ├── auth.py                    # Auth endpoints
│   │   └── users.py                   # User management
│   ├── middleware/
│   │   └── auth.py                    # JWT verification
│   ├── utils/
│   │   └── auth.py                    # JWT helpers
│   ├── config.py                      # Settings
│   ├── database.py                    # DB setup
│   └── main.py                        # FastAPI app
├── add_user_columns.sql               # ⚠️ MIGRATION PENDING
└── .env

frontend/
├── src/
│   ├── services/
│   │   ├── api.ts                     # Axios instance
│   │   └── auth.ts                    # Auth API
│   ├── contexts/
│   │   └── AuthContext.tsx            # Global auth state
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx     # Route protection
│   │   └── layout/
│   │       └── Navigation.tsx         # Nav with auth
│   ├── pages/
│   │   ├── LoginPage.tsx              # Login form
│   │   ├── RegisterPage.tsx           # Registration
│   │   └── ProfilePage.tsx            # Profile view/edit
│   ├── App.tsx                        # Routes
│   └── main.tsx                       # Entry point
└── .env
```

---

### API Endpoints Reference

#### Public Endpoints
```
POST   /api/auth/register              Create account
POST   /api/auth/login                 Get JWT tokens
POST   /api/auth/refresh               Refresh access token
POST   /api/auth/forgot-password       Request reset
POST   /api/auth/reset-password        Reset with token
```

#### Authenticated Endpoints
```
GET    /api/auth/me                    Current user info
POST   /api/auth/logout                Logout
POST   /api/auth/change-password       Change password
GET    /api/users/me                   Full profile
PUT    /api/users/me                   Update profile
GET    /api/users/me/stats             User statistics
```

#### Manager/Admin Endpoints
```
GET    /api/users/                     List all users
GET    /api/users/{id}                 Get user by ID
GET    /api/users/{id}/stats           User stats by ID
```

#### Admin Only Endpoints
```
PUT    /api/users/{id}                 Update user
DELETE /api/users/{id}                 Soft delete
POST   /api/users/{id}/activate        Activate user
POST   /api/users/{id}/deactivate      Deactivate user
POST   /api/users/{id}/verify          Verify email
POST   /api/users/{id}/points          Update points
POST   /api/users/{id}/tokens          Update tokens
```

---

### Testing Checklist

**Database Migration:**
- [ ] Migration script executed in Supabase
- [ ] New columns exist in users table
- [ ] Indexes created successfully

**Backend API:**
- [ ] Backend starts without errors
- [ ] Swagger docs accessible at http://localhost:8000/docs
- [ ] Can register new user
- [ ] Can login and receive tokens
- [ ] Protected endpoints require auth
- [ ] Token refresh works
- [ ] Password change works

**Frontend:**
- [ ] Frontend starts at http://localhost:5173
- [ ] Can access login page
- [ ] Can register new account
- [ ] Redirected to floor plan after login
- [ ] Can view profile
- [ ] Can edit profile
- [ ] Can logout
- [ ] Protected routes redirect to login
- [ ] Token auto-refresh works
- [ ] Navigation shows correct items based on auth state

---

### Known Limitations

1. **Email Verification:** Endpoint exists but not fully implemented (no email sending)
2. **Password Reset Emails:** Returns token in DEBUG mode, email integration TODO
3. **User Stats:** `get_user_stats()` returns placeholder data (booking integration pending)
4. **Token Blacklist:** Logout doesn't blacklist tokens (consider Redis for production)
5. **Rate Limiting:** Not implemented yet
6. **Account Deletion:** Soft delete only (hard delete not implemented)

---

### Next Steps After Migration

1. **Run Migration:**
   - Execute `backend/add_user_columns.sql` in Supabase
   - Verify columns added successfully

2. **Test Complete Flow:**
   - Start backend: `uvicorn app.main:app --reload`
   - Start frontend: `npm run dev`
   - Register new user
   - Login and verify token
   - View/edit profile
   - Test admin endpoints (if admin user exists)

3. **Integration Tasks:**
   - Connect user system to booking system
   - Implement user stats from actual bookings
   - Add email verification flow
   - Set up SMTP for password reset emails
   - Integrate gamification (points on bookings)

---

**END OF SESSION CONTEXT**

To resume work in next session:
1. Read this file for complete context
2. 3D floor plan viewer fully implemented and working
3. User authentication system code complete
4. **ACTION REQUIRED:** Run database migration before testing auth
5. Ready for booking system integration
