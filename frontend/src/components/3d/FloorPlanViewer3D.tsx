import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';
import { FloorPlanData, MeshConfiguration, Point } from '@/types';
import { MeshLoader } from './MeshLoader';

interface FloorPlanViewer3DProps {
  floorPlanData: FloorPlanData;
  onObjectClick?: (objectId: string, objectType: string) => void;
  selectedObjectId?: string | null;
}

/**
 * FloorPlanViewer3D - Main 3D viewer component for floor plans
 * Renders rooms and objects using custom 3D meshes based on the JSON floor plan data
 */
export function FloorPlanViewer3D({
  floorPlanData,
  onObjectClick,
  selectedObjectId,
}: FloorPlanViewer3DProps) {
  const [meshConfig, setMeshConfig] = useState<MeshConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  // Load mesh configuration
  useEffect(() => {
    fetch('/assets/meshes/mesh-config.json')
      .then((res) => res.json())
      .then((config) => {
        setMeshConfig(config);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading mesh config:', error);
        setLoading(false);
      });
  }, []);

  if (loading || !meshConfig) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading 3D Floor Plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{
          position: [0, 50, 50],
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
          position={[10, 20, 5]}
          intensity={meshConfig.settings.directionalLightIntensity}
          castShadow={meshConfig.settings.enableShadows}
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-10, 10, -5]} intensity={0.5} />

        {/* Environment */}
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        {/* Grid Helper */}
        {meshConfig.settings.gridHelper && (
          <Grid
            args={[300, 300]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#4b5563"
            fadeDistance={400}
            fadeStrength={1}
          />
        )}

        {/* Floor Plan Objects */}
        <Suspense fallback={null}>
          <FloorPlanObjects
            floorPlanData={floorPlanData}
            meshConfig={meshConfig}
            onObjectClick={onObjectClick}
            selectedObjectId={selectedObjectId}
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
          minDistance={10}
          maxDistance={200}
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
    </div>
  );
}

interface FloorPlanObjectsProps {
  floorPlanData: FloorPlanData;
  meshConfig: MeshConfiguration;
  onObjectClick?: (objectId: string, objectType: string) => void;
  selectedObjectId?: string | null;
}

function FloorPlanObjects({
  floorPlanData,
  meshConfig,
  onObjectClick,
  selectedObjectId,
}: FloorPlanObjectsProps) {
  // Helper function to convert 2D polygon to 3D position
  const get3DPosition = (bounds: any, offset: [number, number, number]): [number, number, number] => {
    // Scale down the coordinates (floor plans are often in large units)
    const scale = 0.01; // Adjust this based on your floor plan scale

    const x = (bounds.centerX * scale) + offset[0];
    const y = offset[1]; // Y is height
    const z = (bounds.centerY * scale) + offset[2];

    return [x, y, z];
  };

  return (
    <group>
      {/* Render Rooms */}
      {floorPlanData.rooms.map((room) => {
        const config = meshConfig.meshes[room.type] || meshConfig.meshes.room;
        if (!config) return null;

        const position = get3DPosition(room.bounds, config.offset);
        const isSelected = selectedObjectId === room.id;

        return (
          <MeshLoader
            key={room.id}
            type={room.type}
            config={config}
            position={position}
            onClick={() => onObjectClick?.(room.id, room.type)}
            isSelected={isSelected}
          />
        );
      })}

      {/* Render Objects */}
      {floorPlanData.objects.map((object) => {
        const config = meshConfig.meshes[object.type];
        if (!config) {
          console.warn(`No mesh config found for object type: ${object.type}`);
          return null;
        }

        const position = get3DPosition(object.bounds, config.offset);
        const isSelected = selectedObjectId === object.id;

        return (
          <MeshLoader
            key={object.id}
            type={object.type}
            config={config}
            position={position}
            onClick={() => onObjectClick?.(object.id, object.type)}
            isSelected={isSelected}
          />
        );
      })}
    </group>
  );
}

export default FloorPlanViewer3D;
