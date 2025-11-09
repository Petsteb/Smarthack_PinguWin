import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Grid, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { FloorData, MeshConfiguration, Rectangle } from '@/types';
import * as THREE from 'three';
import { Check, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface FloorPlanViewer3DProps {
  onObjectClick?: (objectName: string, objectType: string) => void;
  selectedObject?: string | null;
}

// Predefined room colors for visual distinction
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

// Helper function to darken a color (creates black overlay effect)
function darkenColor(color: string, factor: number): string {
  const c = new THREE.Color(color);
  return '#' + c.multiplyScalar(factor).getHexString();
}

// Fixed camera positions
// Floor plan center (calculated from floor_data.json exterior walls)
// X range: 297 to 3286.75, Y range: 312.51 to 1270.1
// Center: (1791.875, 791.305) * scale 0.05 = (89.59, 39.57)
const FLOOR_CENTER_X = 89.6;
const FLOOR_CENTER_Z = 39.6;
const CAMERA_DISTANCE = 120; // Closer to ground
const ELEVATION_ANGLE = Math.PI / 4; // 45 degrees in radians

// 4 fixed 3D viewpoints at 45° vertical, 90° horizontal increments, centered on floor plan
const CAMERA_POSITIONS_3D = [
  {
    position: new THREE.Vector3(
      FLOOR_CENTER_X + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.cos(0),
      CAMERA_DISTANCE * Math.sin(ELEVATION_ANGLE),
      FLOOR_CENTER_Z + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.sin(0)
    ),
    target: new THREE.Vector3(FLOOR_CENTER_X, 0, FLOOR_CENTER_Z),
  },
  {
    position: new THREE.Vector3(
      FLOOR_CENTER_X + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.cos(Math.PI / 2),
      CAMERA_DISTANCE * Math.sin(ELEVATION_ANGLE),
      FLOOR_CENTER_Z + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.sin(Math.PI / 2)
    ),
    target: new THREE.Vector3(FLOOR_CENTER_X, 0, FLOOR_CENTER_Z),
  },
  {
    position: new THREE.Vector3(
      FLOOR_CENTER_X + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.cos(Math.PI),
      CAMERA_DISTANCE * Math.sin(ELEVATION_ANGLE),
      FLOOR_CENTER_Z + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.sin(Math.PI)
    ),
    target: new THREE.Vector3(FLOOR_CENTER_X, 0, FLOOR_CENTER_Z),
  },
  {
    position: new THREE.Vector3(
      FLOOR_CENTER_X + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.cos(3 * Math.PI / 2),
      CAMERA_DISTANCE * Math.sin(ELEVATION_ANGLE),
      FLOOR_CENTER_Z + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.sin(3 * Math.PI / 2)
    ),
    target: new THREE.Vector3(FLOOR_CENTER_X, 0, FLOOR_CENTER_Z),
  },
];

// Bird's eye view positions (top-down with 2 orientations) - much closer to ground
const BIRD_EYE_HEIGHT = 100; // Lowered from 250 to 100
const CAMERA_POSITIONS_BIRD = [
  {
    position: new THREE.Vector3(FLOOR_CENTER_X, BIRD_EYE_HEIGHT, FLOOR_CENTER_Z),
    target: new THREE.Vector3(FLOOR_CENTER_X, 0, FLOOR_CENTER_Z),
    up: new THREE.Vector3(0, 0, -1), // Horizontal orientation
  },
  {
    position: new THREE.Vector3(FLOOR_CENTER_X, BIRD_EYE_HEIGHT, FLOOR_CENTER_Z),
    target: new THREE.Vector3(FLOOR_CENTER_X, 0, FLOOR_CENTER_Z),
    up: new THREE.Vector3(1, 0, 0), // Vertical orientation (90° rotated)
  },
];

/**
 * FloorPlanViewer3D - Main 3D viewer component for floor plans
 * Loads floor_data.json and renders rooms and objects
 * Rooms are rendered as colored floor rectangles
 * Objects (desks, chairs, tables) are rendered as extruded boxes
 */
export function FloorPlanViewer3D({
  onObjectClick,
  selectedObject,
}: FloorPlanViewer3DProps) {
  const [floorData, setFloorData] = useState<FloorData | null>(null);
  const [meshConfig, setMeshConfig] = useState<MeshConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [visibleObjects, setVisibleObjects] = useState<Set<string>>(new Set());
  const [showRooms, setShowRooms] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [showExteriorWalls, setShowExteriorWalls] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Hover state
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  // Camera view state
  const [currentView3D, setCurrentView3D] = useState(0); // 0-3 for the 4 3D viewpoints
  const [isBirdEyeView, setIsBirdEyeView] = useState(false); // false = 3D view, true = bird's eye
  const [birdEyeOrientation, setBirdEyeOrientation] = useState(0); // 0 or 1 for horizontal/vertical

  // Zoom state (100% = base, 50% min, 200% max)
  const [zoomLevel, setZoomLevel] = useState(100);

  // Load all required data
  useEffect(() => {
    Promise.all([
      fetch('/floor_data.json').then((res) => res.json()),
      fetch('/assets/meshes/mesh-config.json').then((res) => res.json()),
    ])
      .then(([floorDataJson, meshCfg]) => {
        setFloorData(floorDataJson);
        setMeshConfig(meshCfg);

        // Initialize all objects as visible
        setVisibleObjects(new Set(Object.keys(floorDataJson)));

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading floor plan data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Camera navigation functions
  const rotateLeft = () => {
    if (!isBirdEyeView) {
      setCurrentView3D((prev) => (prev + 3) % 4); // Move counterclockwise
    } else {
      // In bird's eye view, rotate orientation
      setBirdEyeOrientation((prev) => (prev + 1) % 2);
    }
  };

  const rotateRight = () => {
    if (!isBirdEyeView) {
      setCurrentView3D((prev) => (prev + 1) % 4); // Move clockwise
    } else {
      // In bird's eye view, rotate orientation
      setBirdEyeOrientation((prev) => (prev + 1) % 2);
    }
  };

  const switchToBirdEye = () => {
    setIsBirdEyeView(true);
  };

  const switchTo3DView = () => {
    setIsBirdEyeView(false);
  };

  // Zoom functions (50% to 200%)
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  // Categorize objects into walls, rooms, and regular objects
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

        // Helper function to check if an object is within a space rectangle
        const isWithinSpace = (obj: any, space: any) => {
          const objCenterX = obj.x + obj.width / 2;
          const objCenterY = obj.y + obj.height / 2;
          return (
            objCenterX >= space.x &&
            objCenterX <= space.x + space.width &&
            objCenterY >= space.y &&
            objCenterY <= space.y + space.height
          );
        };

        // Special handling for rooms with multiple space rectangles
        if (name === 'teamMeetings') {
          // Extract nested sub-areas as separate rooms
          Object.entries(data).forEach(([subKey, subValue]) => {
            if (subKey !== 'room' && typeof subValue === 'object' && subValue !== null && 'space' in subValue) {
              const subRoomData = subValue as any;

              // Check if we need to split this further based on space rectangles
              // small: 4 independent rooms, square4: 3 independent rooms, round4: 1 room
              if ((subKey === 'small' || subKey === 'square4') && Array.isArray(subRoomData.space) && subRoomData.space.length > 1) {
                // Split each space rectangle into its own room
                subRoomData.space.forEach((spaceRect: any, index: number) => {
                  const individualRoomName = `${name}-${subKey}-${index}`;

                  // Filter chairs and tables based on coordinates within this space
                  const chairsInSpace = subRoomData.chairs
                    ? subRoomData.chairs.filter((chair: any) => isWithinSpace(chair, spaceRect))
                    : [];

                  const tablesInSpace = subRoomData.tables
                    ? subRoomData.tables.filter((table: any) => isWithinSpace(table, spaceRect))
                    : [];

                  const individualRoomData = {
                    space: [spaceRect],
                    room: 1,
                    ...(chairsInSpace.length > 0 && { chairs: chairsInSpace }),
                    ...(tablesInSpace.length > 0 && { tables: tablesInSpace })
                  };
                  roomsList.push({ name: individualRoomName, data: individualRoomData, color });
                });
              } else {
                // Keep as single room (like round4)
                const subRoomName = `${name}-${subKey}`;
                const subRoomDataWithRoom = { ...subRoomData, room: 1 };
                roomsList.push({ name: subRoomName, data: subRoomDataWithRoom, color });
              }
            }
          });
        } else if (name === 'managementRoom' && Array.isArray(data.space) && data.space.length > 1) {
          // Split managementRoom into individual rooms (3 rooms)
          data.space.forEach((spaceRect: any, index: number) => {
            const individualRoomName = `${name}-${index}`;

            // Filter chairs and tables based on coordinates within this space
            const chairsInSpace = data.chairs
              ? data.chairs.filter((chair: any) => isWithinSpace(chair, spaceRect))
              : [];

            const tablesInSpace = data.tables
              ? data.tables.filter((table: any) => isWithinSpace(table, spaceRect))
              : [];

            const individualRoomData = {
              space: [spaceRect],
              room: 1,
              ...(chairsInSpace.length > 0 && { chairs: chairsInSpace }),
              ...(tablesInSpace.length > 0 && { tables: tablesInSpace })
            };
            roomsList.push({ name: individualRoomName, data: individualRoomData, color });
          });
        } else {
          roomsList.push({ name, data, color });
        }

        roomColorIndex++;
      } else {
        objectsList.push({ name, data });
      }
    });

    return { walls: wallsData, rooms: roomsList, objects: objectsList };
  }, [floorData]);

  // Toggle object visibility
  const toggleObject = (name: string) => {
    setVisibleObjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  // Toggle all objects of a type
  const toggleAllOfType = (objectNames: string[], show: boolean) => {
    setVisibleObjects(prev => {
      const newSet = new Set(prev);
      objectNames.forEach(name => {
        if (show) {
          newSet.add(name);
        } else {
          newSet.delete(name);
        }
      });
      return newSet;
    });
  };

  if (loading || !meshConfig || !floorData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading 3D Floor Plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading floor plan</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex">
      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{
            position: [
              FLOOR_CENTER_X + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.cos(0),
              CAMERA_DISTANCE * Math.sin(ELEVATION_ANGLE),
              FLOOR_CENTER_Z + CAMERA_DISTANCE * Math.cos(ELEVATION_ANGLE) * Math.sin(0)
            ],
            fov: 60,
            near: 0.1,
            far: 10000,
          }}
          shadows={meshConfig.settings.enableShadows}
          style={{ background: meshConfig.settings.backgroundColor }}
        >
          {/* Lighting */}
          <ambientLight intensity={meshConfig.settings.ambientLightIntensity} />
          <directionalLight
            position={[50, 100, 50]}
            intensity={meshConfig.settings.directionalLightIntensity}
            castShadow={meshConfig.settings.enableShadows}
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-50, 50, -50]} intensity={0.5} />

          {/* Environment */}
          <Suspense fallback={null}>
            <Environment preset="city" />
          </Suspense>

          {/* Grid Helper */}
          {showGrid && (
            <Grid
              args={[2000, 2000]}
              cellSize={10}
              cellThickness={0.5}
              cellColor="#6b7280"
              sectionSize={50}
              sectionThickness={1}
              sectionColor="#4b5563"
              fadeDistance={1500}
              fadeStrength={1}
            />
          )}

          {/* Render Walls */}
          {walls && (
            <Suspense fallback={null}>
              <WallsRenderer
                walls={walls}
                meshConfig={meshConfig}
                showInterior={showWalls}
                showExterior={showExteriorWalls}
              />
            </Suspense>
          )}

          {/* Render Rooms as Floor Rectangles */}
          <Suspense fallback={null}>
            <RoomFloors
              rooms={rooms}
              visibleObjects={visibleObjects}
              onRoomClick={onObjectClick}
              selectedObject={selectedObject}
              hoveredObject={hoveredObject}
              onHover={setHoveredObject}
            />
          </Suspense>

          {/* Render Objects */}
          <Suspense fallback={null}>
            <FloorPlanObjects
              objects={objects}
              meshConfig={meshConfig}
              visibleObjects={visibleObjects}
              onObjectClick={onObjectClick}
              selectedObject={selectedObject}
              hoveredObject={hoveredObject}
              onHover={setHoveredObject}
            />
          </Suspense>

          {/* Camera Controls */}
          <CameraController
            isBirdEyeView={isBirdEyeView}
            currentView3D={currentView3D}
            birdEyeOrientation={birdEyeOrientation}
            zoomLevel={zoomLevel}
          />
        </Canvas>

        {/* Navigation Arrows - Bottom Center */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
          {/* Up/Down Arrows for Bird's Eye View Toggle */}
          <div className="flex items-center justify-center">
            {!isBirdEyeView ? (
              <button
                onClick={switchToBirdEye}
                className="bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-lg shadow-lg transition-all hover:scale-110"
                title="Switch to Bird's Eye View"
              >
                <ChevronUp className="w-6 h-6 text-gray-700" />
              </button>
            ) : (
              <button
                onClick={switchTo3DView}
                className="bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-lg shadow-lg transition-all hover:scale-110"
                title="Switch to 3D View"
              >
                <ChevronDown className="w-6 h-6 text-gray-700" />
              </button>
            )}
          </div>

          {/* Left/Right Arrows for Rotation */}
          <div className="flex items-center gap-3">
            <button
              onClick={rotateLeft}
              className="bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-lg shadow-lg transition-all hover:scale-110"
              title={isBirdEyeView ? "Rotate View" : "Rotate Left"}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm font-semibold text-gray-700">
              {isBirdEyeView ? `Bird's Eye (${birdEyeOrientation === 0 ? 'H' : 'V'})` : `View ${currentView3D + 1}/4`}
            </div>
            <button
              onClick={rotateRight}
              className="bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-lg shadow-lg transition-all hover:scale-110"
              title={isBirdEyeView ? "Rotate View" : "Rotate Right"}
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* View Info & Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          {/* View Info */}
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm">
            <p className="font-semibold text-gray-900">
              {isBirdEyeView ? "Bird's Eye View" : "3D View"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Click objects to select
            </p>
          </div>

          {/* Zoom Controls */}
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">Zoom: {zoomLevel}%</p>
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 50}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  zoomLevel <= 50
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
                title="Zoom Out"
              >
                -
              </button>
              <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-200"
                  style={{ width: `${((zoomLevel - 50) / 150) * 100}%` }}
                />
              </div>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 200}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  zoomLevel >= 200
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Object Count */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-900">
            {rooms.length} Rooms • {objects.length} Objects
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Filters</h2>

          {/* Rooms Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">Rooms ({rooms.length})</h3>
              <button
                onClick={() => {
                  const newShowRooms = !showRooms;
                  setShowRooms(newShowRooms);
                  // Update all room visibilities when toggling show/hide all
                  if (newShowRooms) {
                    // Show all rooms
                    toggleAllOfType(rooms.map(r => r.name), true);
                  } else {
                    // Hide all rooms
                    toggleAllOfType(rooms.map(r => r.name), false);
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200"
              >
                {showRooms ? 'Hide All' : 'Show All'}
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rooms.map(({ name, color }) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700 truncate">{name}</span>
                  </div>
                  <button
                    onClick={() => toggleObject(name)}
                    className={`text-xs px-3 py-1 rounded ${
                      visibleObjects.has(name)
                        ? 'bg-green-100 hover:bg-green-200'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {visibleObjects.has(name) ? 'Hide' : 'Show'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Objects Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">Objects ({objects.length + 3})</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setShowGrid(true);
                    setShowWalls(true);
                    setShowExteriorWalls(true);
                    toggleAllOfType(objects.map(o => o.name), true);
                  }}
                  className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200"
                  title="Show all objects"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setShowGrid(false);
                    setShowWalls(false);
                    setShowExteriorWalls(false);
                    toggleAllOfType(objects.map(o => o.name), false);
                  }}
                  className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200"
                  title="Hide all objects"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {/* Grid */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-700 truncate flex-1">Grid</span>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`text-xs px-3 py-1 rounded ${
                    showGrid ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {showGrid ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Interior Walls */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-700 truncate flex-1">Interior Walls</span>
                <button
                  onClick={() => setShowWalls(!showWalls)}
                  className={`text-xs px-3 py-1 rounded ${
                    showWalls ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {showWalls ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Exterior Walls */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-700 truncate flex-1">Exterior Walls</span>
                <button
                  onClick={() => setShowExteriorWalls(!showExteriorWalls)}
                  className={`text-xs px-3 py-1 rounded ${
                    showExteriorWalls ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {showExteriorWalls ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Regular objects */}
              {objects.map(({ name }) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">{name}</span>
                  <button
                    onClick={() => toggleObject(name)}
                    className={`text-xs px-3 py-1 rounded ${
                      visibleObjects.has(name)
                        ? 'bg-green-100 hover:bg-green-200'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {visibleObjects.has(name) ? 'Hide' : 'Show'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Camera Controller Component
interface CameraControllerProps {
  isBirdEyeView: boolean;
  currentView3D: number;
  birdEyeOrientation: number;
  zoomLevel: number;
}

function CameraController({ isBirdEyeView, currentView3D, birdEyeOrientation, zoomLevel }: CameraControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const targetUp = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    // Calculate zoom factor (100% = 1.0, 200% = 0.5, 50% = 2.0)
    // Inverse relationship: higher zoom = closer camera = smaller distance multiplier
    const zoomFactor = 100 / zoomLevel;

    // Update target based on current view
    if (isBirdEyeView) {
      const birdConfig = CAMERA_POSITIONS_BIRD[birdEyeOrientation];
      // Apply zoom to bird's eye height
      const zoomedPosition = birdConfig.position.clone();
      zoomedPosition.y *= zoomFactor;
      targetPosition.current.copy(zoomedPosition);
      targetLookAt.current.copy(birdConfig.target);
      targetUp.current.copy(birdConfig.up);
    } else {
      const viewConfig = CAMERA_POSITIONS_3D[currentView3D];
      // Apply zoom to 3D view position (distance from center)
      const direction = viewConfig.position.clone().sub(viewConfig.target);
      const zoomedPosition = viewConfig.target.clone().add(direction.multiplyScalar(zoomFactor));
      targetPosition.current.copy(zoomedPosition);
      targetLookAt.current.copy(viewConfig.target);
      targetUp.current.set(0, 1, 0); // Standard up vector for 3D views
    }
  }, [isBirdEyeView, currentView3D, birdEyeOrientation, zoomLevel]);

  useFrame(() => {
    // Smooth camera position transition
    camera.position.lerp(targetPosition.current, 0.1);

    // Smooth camera look-at transition
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(100).add(camera.position);
    currentLookAt.lerp(targetLookAt.current, 0.1);
    camera.lookAt(currentLookAt);

    // Smooth up vector transition
    camera.up.lerp(targetUp.current, 0.1);
    camera.up.normalize();
  });

  return null;
}

// Component to render walls
interface WallsRendererProps {
  walls: any;
  meshConfig: MeshConfiguration;
  showInterior: boolean;
  showExterior: boolean;
}

function WallsRenderer({ walls, meshConfig, showInterior, showExterior }: WallsRendererProps) {
  const scale = 0.05;
  const wallConfig = meshConfig.meshes.wall;

  if (!walls) return null;

  const renderWalls = (wallsArray: any[], keyPrefix: string) => {
    if (!Array.isArray(wallsArray)) return null;

    return wallsArray.map((rect: any, index: number) => {
      const centerX = (rect.x + rect.width / 2) * scale;
      const centerZ = (rect.y + rect.height / 2) * scale;
      const width = rect.width * scale;
      const depth = rect.height * scale;
      const height = 4; // Wall height

      return (
        <mesh
          key={`${keyPrefix}-${index}`}
          position={[centerX, height / 2, centerZ]}
          onPointerOver={(e) => {
            e.stopPropagation();
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={wallConfig?.color || '#BDC3C7'} />
        </mesh>
      );
    });
  };

  return (
    <group>
      {showInterior && walls.interior && renderWalls(walls.interior, 'wall-interior')}
      {showExterior && walls.exterior && renderWalls(walls.exterior, 'wall-exterior')}
    </group>
  );
}

// Component to render room floors
interface RoomFloorsProps {
  rooms: Array<{ name: string; data: FloorData[string]; color: string }>;
  visibleObjects: Set<string>;
  onRoomClick?: (objectName: string, objectType: string) => void;
  selectedObject?: string | null;
  hoveredObject?: string | null;
  onHover?: (objectName: string | null) => void;
}

function RoomFloors({ rooms, visibleObjects, onRoomClick, selectedObject, hoveredObject, onHover }: RoomFloorsProps) {
  const scale = 0.05; // Scale factor for converting coordinates

  // Helper function to render furniture (tables/chairs) for a room or sub-area
  const renderFurniture = (
    name: string,
    data: any,
    isSelected: boolean,
    keyPrefix: string
  ) => {
    const furniture: JSX.Element[] = [];

    // Render tables
    if (data.tables && Array.isArray(data.tables)) {
      data.tables.forEach((rect: Rectangle, index: number) => {
        const centerX = (rect.x + rect.width / 2) * scale;
        const centerZ = (rect.y + rect.height / 2) * scale;
        const width = rect.width * scale;
        const depth = rect.height * scale;
        const height = 1.5;

        furniture.push(
          <mesh
            key={`${keyPrefix}-table-${index}`}
            position={[centerX, height / 2, centerZ]}
            onClick={(e) => {
              e.stopPropagation();
              onRoomClick?.(name, 'table');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color={isSelected ? darkenColor('#9B59B6', 0.2) : '#9B59B6'}
              emissive={isSelected ? '#FFFFFF' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
              roughness={isSelected ? 0.3 : 0.5}
            />
          </mesh>
        );
      });
    }

    // Render chairs
    if (data.chairs && Array.isArray(data.chairs)) {
      data.chairs.forEach((rect: Rectangle, index: number) => {
        const centerX = (rect.x + rect.width / 2) * scale;
        const centerZ = (rect.y + rect.height / 2) * scale;
        const width = rect.width * scale;
        const depth = rect.height * scale;
        const height = 1.0;

        furniture.push(
          <mesh
            key={`${keyPrefix}-chair-${index}`}
            position={[centerX, height / 2, centerZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color="#FFD93D"
            />
          </mesh>
        );
      });
    }

    // Render chairsNormal (for wellbeing room)
    if (data.chairsNormal && Array.isArray(data.chairsNormal)) {
      data.chairsNormal.forEach((rect: Rectangle, index: number) => {
        const centerX = (rect.x + rect.width / 2) * scale;
        const centerZ = (rect.y + rect.height / 2) * scale;
        const width = rect.width * scale;
        const depth = rect.height * scale;
        const height = 1.0;

        furniture.push(
          <mesh
            key={`${keyPrefix}-chairNormal-${index}`}
            position={[centerX, height / 2, centerZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color="#FFD93D"
            />
          </mesh>
        );
      });
    }

    // Render chairsElipsa (for wellbeing room)
    if (data.chairsElipsa && Array.isArray(data.chairsElipsa)) {
      data.chairsElipsa.forEach((rect: Rectangle, index: number) => {
        const centerX = (rect.x + rect.width / 2) * scale;
        const centerZ = (rect.y + rect.height / 2) * scale;
        const width = rect.width * scale;
        const depth = rect.height * scale;
        const height = 1.0;

        furniture.push(
          <mesh
            key={`${keyPrefix}-chairElipsa-${index}`}
            position={[centerX, height / 2, centerZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color="#FFD93D"
            />
          </mesh>
        );
      });
    }

    // Render chairsEvantai (for wellbeing room)
    if (data.chairsEvantai && Array.isArray(data.chairsEvantai)) {
      data.chairsEvantai.forEach((rect: Rectangle, index: number) => {
        const centerX = (rect.x + rect.width / 2) * scale;
        const centerZ = (rect.y + rect.height / 2) * scale;
        const width = rect.width * scale;
        const depth = rect.height * scale;
        const height = 1.0;

        furniture.push(
          <mesh
            key={`${keyPrefix}-chairEvantai-${index}`}
            position={[centerX, height / 2, centerZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color="#FFD93D"
            />
          </mesh>
        );
      });
    }

    return furniture;
  };


  return (
    <group>
      {rooms.map(({ name, data, color }) => {
        if (!visibleObjects.has(name)) return null;

        const isSelected = selectedObject === name;
        const isHovered = hoveredObject === name;
        const hasMainSpace = data.space && Array.isArray(data.space) && data.space.length > 0;

        return (
          <group key={name}>
            {/* Render main room floor if it has space */}
            {hasMainSpace && data.space!.map((rect, rectIndex) => {
              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;

              return (
                <mesh
                  key={`${name}-floor-${rectIndex}`}
                  position={[centerX, 0.1, centerZ]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRoomClick?.(name, 'room');
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover?.(name);
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    onHover?.(null);
                    document.body.style.cursor = 'default';
                  }}
                  receiveShadow
                >
                  <planeGeometry args={[width, depth]} />
                  <meshStandardMaterial
                    color={isSelected ? darkenColor(color, 0.2) : isHovered ? darkenColor(color, 0.4) : color}
                    opacity={isSelected ? 0.85 : isHovered ? 0.75 : 0.7}
                    transparent
                    side={THREE.DoubleSide}
                    emissive={isSelected ? '#FFFFFF' : isHovered ? '#CCCCCC' : '#000000'}
                    emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                    roughness={isSelected ? 0.3 : isHovered ? 0.4 : 0.5}
                  />
                </mesh>
              );
            })}

            {/* Render furniture in main room */}
            {renderFurniture(name, data, isSelected, name)}
          </group>
        );
      })}
    </group>
  );
}

// Component to render objects as extruded boxes
interface FloorPlanObjectsProps {
  objects: Array<{ name: string; data: FloorData[string] }>;
  meshConfig: MeshConfiguration;
  visibleObjects: Set<string>;
  onObjectClick?: (objectName: string, objectType: string) => void;
  selectedObject?: string | null;
  hoveredObject?: string | null;
  onHover?: (objectName: string | null) => void;
}

function FloorPlanObjects({
  objects,
  meshConfig,
  visibleObjects,
  onObjectClick,
  selectedObject,
  hoveredObject,
  onHover,
}: FloorPlanObjectsProps) {
  const scale = 0.05; // Scale factor for converting coordinates

  // Map object names to mesh types
  const getMeshType = (name: string, subType?: 'chairs' | 'tables'): string => {
    if (subType === 'chairs') return 'chair';
    if (subType === 'tables') return 'table';

    // Map object names to mesh types
    const nameLower = name.toLowerCase();
    if (nameLower.includes('desk')) return 'desk';
    if (nameLower.includes('chair')) return 'chair';
    if (nameLower.includes('table') || nameLower.includes('billiard')) return 'table';
    if (nameLower.includes('wall')) return 'wall';

    // Default to desk for unknown types
    return 'desk';
  };

  return (
    <group>
      {objects.map(({ name, data }) => {
        if (!visibleObjects.has(name)) return null;
        if (!data.space || !Array.isArray(data.space) || data.space.length === 0) return null;

        const isSelected = selectedObject === name;
        const isHovered = hoveredObject === name;
        const meshType = getMeshType(name);
        const config = meshConfig.meshes[meshType];

        if (!config) {
          console.warn(`No mesh config found for type: ${meshType}`);
          return null;
        }

        return (
          <group key={name}>
            {/* Render main space objects */}
            {data.space.map((rect, index) => {
              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;

              // Set height based on object type
              let height = 1.2; // Default for desks
              if (meshType === 'wall') height = 4;
              else if (meshType === 'table') height = 1.5;
              else if (meshType === 'chair') height = 1.0;

              // Create unique identifier for this individual desk
              const individualId = `${name}-${index}`;
              const isIndividualSelected = selectedObject === individualId;
              const isIndividualHovered = hoveredObject === individualId;

              return (
                <mesh
                  key={`${name}-space-${index}`}
                  position={[centerX, height / 2, centerZ]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onObjectClick?.(individualId, meshType);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover?.(individualId);
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    onHover?.(null);
                    document.body.style.cursor = 'default';
                  }}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial
                    color={isIndividualSelected ? darkenColor(config.color, 0.2) : isIndividualHovered ? darkenColor(config.color, 0.4) : config.color}
                    emissive={isIndividualSelected ? '#FFFFFF' : isIndividualHovered ? '#CCCCCC' : '#000000'}
                    emissiveIntensity={isIndividualSelected ? 0.3 : isIndividualHovered ? 0.2 : 0}
                    roughness={isIndividualSelected ? 0.3 : isIndividualHovered ? 0.4 : 0.5}
                  />
                </mesh>
              );
            })}

            {/* Render chairs if present */}
            {data.chairs && Array.isArray(data.chairs) && data.chairs.map((rect, index) => {
              const chairConfig = meshConfig.meshes.chair;
              if (!chairConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;
              const height = 1.0; // Chair height

              return (
                <mesh
                  key={`${name}-chair-${index}`}
                  position={[centerX, height / 2, centerZ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial
                    color={chairConfig.color}
                  />
                </mesh>
              );
            })}

            {/* Render chairsNormal if present (for wellbeing room) */}
            {data.chairsNormal && Array.isArray(data.chairsNormal) && data.chairsNormal.map((rect, index) => {
              const chairConfig = meshConfig.meshes.chair;
              if (!chairConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;
              const height = 1.0; // Chair height

              return (
                <mesh
                  key={`${name}-chairNormal-${index}`}
                  position={[centerX, height / 2, centerZ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial
                    color={chairConfig.color}
                  />
                </mesh>
              );
            })}

            {/* Render chairsElipsa if present (for wellbeing room) */}
            {data.chairsElipsa && Array.isArray(data.chairsElipsa) && data.chairsElipsa.map((rect, index) => {
              const chairConfig = meshConfig.meshes.chair;
              if (!chairConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;
              const height = 1.0; // Chair height

              return (
                <mesh
                  key={`${name}-chairElipsa-${index}`}
                  position={[centerX, height / 2, centerZ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial
                    color={chairConfig.color}
                  />
                </mesh>
              );
            })}

            {/* Render chairsEvantai if present (for wellbeing room) */}
            {data.chairsEvantai && Array.isArray(data.chairsEvantai) && data.chairsEvantai.map((rect, index) => {
              const chairConfig = meshConfig.meshes.chair;
              if (!chairConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;
              const height = 1.0; // Chair height

              return (
                <mesh
                  key={`${name}-chairEvantai-${index}`}
                  position={[centerX, height / 2, centerZ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial
                    color={chairConfig.color}
                  />
                </mesh>
              );
            })}

            {/* Render tables if present */}
            {data.tables && Array.isArray(data.tables) && data.tables.map((rect, index) => {
              const tableConfig = meshConfig.meshes.table;
              if (!tableConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;
              const height = 1.5; // Table height

              return (
                <mesh
                  key={`${name}-table-${index}`}
                  position={[centerX, height / 2, centerZ]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onObjectClick?.(name, 'table');
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                  }}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial
                    color={isSelected ? darkenColor(tableConfig.color, 0.2) : tableConfig.color}
                    emissive={isSelected ? '#FFFFFF' : '#000000'}
                    emissiveIntensity={isSelected ? 0.3 : 0}
                    roughness={isSelected ? 0.3 : 0.5}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

export default FloorPlanViewer3D;
