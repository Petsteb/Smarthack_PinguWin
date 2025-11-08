# SmartHack - Room & Desk Booking System

A comprehensive web application for managing office spaces, rooms, desks, and facilities with interactive 3D floor plans.

## Features

- 🏢 Interactive 3D floor plan visualization with custom 3D meshes
- 📅 Real-time room and desk booking system
- 👥 User management with role-based access control (Admin/Manager/User)
- 📊 Analytics and statistics dashboard with heatmaps
- 🎮 Gamification system (achievements, leaderboards, tokens)
- 🔔 Real-time notifications via WebSockets
- 🔗 Integrations (Microsoft Teams webhooks, Google Calendar)
- 📱 Mobile-responsive design
- 🔒 Secure authentication with Supabase
- 🔍 Advanced search and filtering
- ⚡ Conflict prevention for double-booking

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with real-time capabilities
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **WebSockets** - Real-time communication

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Three.js** - 3D visualization
- **React Three Fiber** - React renderer for Three.js
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Project Structure

```
Smarthack_PinguWin/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── config.py          # Configuration
│   │   ├── models/            # Database models
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── schemas/           # Pydantic schemas
│   │   └── utils/             # Utility functions
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # React frontend
│   ├── public/
│   │   └── assets/
│   │       └── meshes/        # 3D mesh files (GLB/GLTF/FBX/OBJ)
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── store/             # State management
│   │   └── types/             # TypeScript types
│   └── package.json
├── floor_plan_data.json       # Floor plan polygon data
└── README.md                  # This file
```

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account

### 1. Add Your 3D Meshes

Before running the app, place your 3D mesh files in `frontend/public/assets/meshes/`:

- `room.glb` - Room/floor mesh
- `chair.glb` - Chair mesh
- `desk.glb` - Desk mesh
- `table.glb` - Table mesh
- `wall.glb` - Wall mesh
- `door.glb` - Door mesh

Supported formats: GLB (recommended), GLTF, FBX, OBJ

See `frontend/public/assets/meshes/README.md` for detailed instructions.

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create `.env` file from `.env.example` and configure:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
```

Run the development server:
```bash
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Documentation

FastAPI provides automatic interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Features Overview

### For Users
- Browse available rooms, desks, and facilities in 3D
- Book spaces with calendar integration
- Receive real-time notifications
- Track personal statistics and achievements
- Join leaderboards and earn tokens

### For Managers
- Approve booking requests
- View team utilization reports
- Manage team members' access
- Configure booking policies

### For Admins
- Full system configuration
- User and role management
- Analytics dashboard
- Integration settings
- Maintenance mode control

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Building for Production
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm run build
```

## License

MIT

## Team

PinguWin - SmartHack 2025
