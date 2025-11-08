import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { FloorData, MeshConfiguration, Rectangle } from '@/types';
import { MeshLoader } from './MeshLoader';
import * as THREE from 'three';
import { Check, X } from 'lucide-react';

interface FloorPlanViewer3DProps {
  onObjectClick?: (objectName: string, objectType: string) => void;
  selectedObject?: string | null;
}

// Predefined room colors for visual distinction
const ROOM_COLORS = [
  '#FFE5E5', // Light red
  '#E5F3FF', // Light blue
  '#E5FFE5', // Light green
  '#FFF5E5', // Light orange
  '#F5E5FF', // Light purple
  '#FFFFE5', // Light yellow
  '#E5FFFF', // Light cyan
  '#FFE5F5', // Light pink
];

/**
 * FloorPlanViewer3D - Main 3D viewer component for floor plans
 * Loads floor_data.json and renders rooms and objects
 * Rooms are rendered as colored floor rectangles
 * Objects (desks, chairs, tables) are rendered as 3D meshes
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

  // Categorize objects into rooms and non-rooms
  const { rooms, objects } = useMemo(() => {
    if (!floorData) return { rooms: [], objects: [] };

    const roomsList: Array<{ name: string; data: FloorData[string] }> = [];
    const objectsList: Array<{ name: string; data: FloorData[string] }> = [];

    Object.entries(floorData).forEach(([name, data]) => {
      if (data.room === 1) {
        roomsList.push({ name, data });
      } else {
        objectsList.push({ name, data });
      }
    });

    return { rooms: roomsList, objects: objectsList };
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
            position: [0, 150, 150],
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
          {meshConfig.settings.gridHelper && (
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

          {/* Render Rooms as Floor Rectangles */}
          {showRooms && (
            <Suspense fallback={null}>
              <RoomFloors rooms={rooms} visibleObjects={visibleObjects} onRoomClick={onObjectClick} selectedObject={selectedObject} />
            </Suspense>
          )}

          {/* Render Objects */}
          <Suspense fallback={null}>
            <FloorPlanObjects
              objects={objects}
              meshConfig={meshConfig}
              visibleObjects={visibleObjects}
              onObjectClick={onObjectClick}
              selectedObject={selectedObject}
            />
          </Suspense>

          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={meshConfig.settings.autoRotation}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minDistance={20}
            maxDistance={800}
          />
        </Canvas>

        {/* Controls Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg text-sm">
          <h3 className="font-semibold mb-2">Controls</h3>
          <ul className="space-y-1 text-gray-700">
            <li>🖱️ Left Click + Drag: Rotate</li>
            <li>🖱️ Right Click + Drag: Pan</li>
            <li>🖱️ Scroll: Zoom</li>
            <li>🖱️ Click Object: Select</li>
          </ul>
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
                onClick={() => setShowRooms(!showRooms)}
                className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200"
              >
                {showRooms ? 'Hide All' : 'Show All'}
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {rooms.map(({ name }) => (
                <label
                  key={name}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">{name}</span>
                  <input
                    type="checkbox"
                    checked={visibleObjects.has(name) && showRooms}
                    onChange={() => toggleObject(name)}
                    disabled={!showRooms}
                    className="ml-2"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Objects Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">Objects ({objects.length})</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleAllOfType(objects.map(o => o.name), true)}
                  className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200"
                  title="Show all objects"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => toggleAllOfType(objects.map(o => o.name), false)}
                  className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200"
                  title="Hide all objects"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {objects.map(({ name }) => (
                <label
                  key={name}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">{name}</span>
                  <input
                    type="checkbox"
                    checked={visibleObjects.has(name)}
                    onChange={() => toggleObject(name)}
                    className="ml-2"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to render room floors
interface RoomFloorsProps {
  rooms: Array<{ name: string; data: FloorData[string] }>;
  visibleObjects: Set<string>;
  onRoomClick?: (objectName: string, objectType: string) => void;
  selectedObject?: string | null;
}

function RoomFloors({ rooms, visibleObjects, onRoomClick, selectedObject }: RoomFloorsProps) {
  const scale = 0.05; // Scale factor for converting coordinates

  return (
    <group>
      {rooms.map(({ name, data }, roomIndex) => {
        if (!visibleObjects.has(name)) return null;

        const roomColor = ROOM_COLORS[roomIndex % ROOM_COLORS.length];
        const isSelected = selectedObject === name;

        return (
          <group key={name}>
            {data.space.map((rect, rectIndex) => {
              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;
              const width = rect.width * scale;
              const depth = rect.height * scale;

              return (
                <mesh
                  key={`${name}-${rectIndex}`}
                  position={[centerX, 0.1, centerZ]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  onClick={() => onRoomClick?.(name, 'room')}
                  receiveShadow
                >
                  <planeGeometry args={[width, depth]} />
                  <meshStandardMaterial
                    color={roomColor}
                    opacity={isSelected ? 0.9 : 0.7}
                    transparent
                    side={THREE.DoubleSide}
                    emissive={isSelected ? roomColor : '#000000'}
                    emissiveIntensity={isSelected ? 0.3 : 0}
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

// Component to render objects with meshes
interface FloorPlanObjectsProps {
  objects: Array<{ name: string; data: FloorData[string] }>;
  meshConfig: MeshConfiguration;
  visibleObjects: Set<string>;
  onObjectClick?: (objectName: string, objectType: string) => void;
  selectedObject?: string | null;
}

function FloorPlanObjects({
  objects,
  meshConfig,
  visibleObjects,
  onObjectClick,
  selectedObject,
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

        const isSelected = selectedObject === name;
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

              return (
                <MeshLoader
                  key={`${name}-space-${index}`}
                  type={meshType}
                  config={config}
                  position={[centerX, 0, centerZ]}
                  onClick={() => onObjectClick?.(name, meshType)}
                  isSelected={isSelected}
                />
              );
            })}

            {/* Render chairs if present */}
            {data.chairs?.map((rect, index) => {
              const chairConfig = meshConfig.meshes.chair;
              if (!chairConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;

              return (
                <MeshLoader
                  key={`${name}-chair-${index}`}
                  type="chair"
                  config={chairConfig}
                  position={[centerX, 0, centerZ]}
                  onClick={() => onObjectClick?.(name, 'chair')}
                  isSelected={isSelected}
                />
              );
            })}

            {/* Render tables if present */}
            {data.tables?.map((rect, index) => {
              const tableConfig = meshConfig.meshes.table;
              if (!tableConfig) return null;

              const centerX = (rect.x + rect.width / 2) * scale;
              const centerZ = (rect.y + rect.height / 2) * scale;

              return (
                <MeshLoader
                  key={`${name}-table-${index}`}
                  type="table"
                  config={tableConfig}
                  position={[centerX, 0, centerZ]}
                  onClick={() => onObjectClick?.(name, 'table')}
                  isSelected={isSelected}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

export default FloorPlanViewer3D;
