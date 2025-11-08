import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { FloorPlanData, MeshConfiguration, ObjectTypeMapping, EnhancedBoundingBox } from '@/types';
import { MeshLoader } from './MeshLoader';
import { classifyObjects, getClassificationStats } from '@/utils/objectClassifier';

interface FloorPlanViewer3DProps {
  onObjectClick?: (objectIndex: number, objectType: string) => void;
  selectedObjectIndex?: number | null;
}

/**
 * FloorPlanViewer3D - Main 3D viewer component for floor plans
 * Loads out.json and renders objects using custom 3D meshes
 * Meshes are positioned at the CENTER of each object's bounding box
 */
export function FloorPlanViewer3D({
  onObjectClick,
  selectedObjectIndex,
}: FloorPlanViewer3DProps) {
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);
  const [enhancedObjects, setEnhancedObjects] = useState<EnhancedBoundingBox[]>([]);
  const [meshConfig, setMeshConfig] = useState<MeshConfiguration | null>(null);
  const [typeMapping, setTypeMapping] = useState<ObjectTypeMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all required data
  useEffect(() => {
    Promise.all([
      fetch('/out.json').then((res) => res.json()),
      fetch('/assets/meshes/mesh-config.json').then((res) => res.json()),
      fetch('/assets/meshes/object-type-mapping.json').then((res) => res.json()),
    ])
      .then(([floorData, meshCfg, typeMappingData]) => {
        setFloorPlanData(floorData);
        setMeshConfig(meshCfg);
        setTypeMapping(typeMappingData);

        // Classify objects based on their dimensions
        const classified = classifyObjects(floorData, typeMappingData);
        setEnhancedObjects(classified);

        // Log classification stats
        const stats = getClassificationStats(classified);
        console.log('Object Classification Stats:', stats);

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading floor plan data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading || !meshConfig || !floorPlanData) {
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
    <div className="w-full h-full relative">
      <Canvas
        camera={{
          position: [0, 100, 100],
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
            args={[500, 500]}
            cellSize={10}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={50}
            sectionThickness={1}
            sectionColor="#4b5563"
            fadeDistance={800}
            fadeStrength={1}
          />
        )}

        {/* Floor Plan Objects */}
        <Suspense fallback={null}>
          <FloorPlanObjects
            objects={enhancedObjects}
            meshConfig={meshConfig}
            onObjectClick={onObjectClick}
            selectedObjectIndex={selectedObjectIndex}
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
          maxDistance={500}
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
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm">
        <p className="font-semibold text-gray-900">
          {enhancedObjects.length} Objects
        </p>
      </div>
    </div>
  );
}

interface FloorPlanObjectsProps {
  objects: EnhancedBoundingBox[];
  meshConfig: MeshConfiguration;
  onObjectClick?: (objectIndex: number, objectType: string) => void;
  selectedObjectIndex?: number | null;
}

function FloorPlanObjects({
  objects,
  meshConfig,
  onObjectClick,
  selectedObjectIndex,
}: FloorPlanObjectsProps) {
  /**
   * Convert 2D bounding box to 3D position
   * Meshes are placed at the CENTER of each bounding box
   */
  const get3DPosition = (obj: EnhancedBoundingBox): [number, number, number] => {
    // Scale factor to convert floor plan coordinates to 3D world coordinates
    // Adjust this value based on your floor plan scale
    const scale = 0.05;

    // Use the calculated center coordinates
    const x = obj.centerX * scale;
    const y = 0; // Y is height (ground level)
    const z = obj.centerY * scale;

    return [x, y, z];
  };

  return (
    <group>
      {objects.map((obj) => {
        const config = meshConfig.meshes[obj.mesh];
        if (!config) {
          console.warn(`No mesh config found for type: ${obj.mesh}`);
          return null;
        }

        const position = get3DPosition(obj);
        const isSelected = selectedObjectIndex === obj.index;

        return (
          <MeshLoader
            key={obj.index}
            type={obj.mesh}
            config={config}
            position={position}
            onClick={() => onObjectClick?.(obj.index, obj.type)}
            isSelected={isSelected}
          />
        );
      })}
    </group>
  );
}

export default FloorPlanViewer3D;
