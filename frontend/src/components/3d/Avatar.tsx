/**
 * Draggable Avatar Component for floor plan navigation
 */
import { useRef, useState, Suspense } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarProps {
  position: [number, number, number];
  onPositionChange: (x: number, z: number) => void;
  enabled: boolean;
}

function BeerMesh() {
  const { scene } = useGLTF('/psx_low_poly_beer.glb');
  console.log('✅ Beer mesh loaded successfully');
  return (
    <primitive
      object={scene.clone()}
      scale={[3, 3, 3]}
      rotation={[0, 0, 0]}
    />
  );
}

// Fallback cube component
function FallbackCube({ isDragging }: { isDragging: boolean }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color={isDragging ? '#ff0000' : '#00ff00'}
        emissive={isDragging ? '#ff0000' : '#00ff00'}
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.8}
      />
    </mesh>
  );
}

export function Avatar({ position, onPositionChange, enabled }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster } = useThree();

  if (!enabled) return null;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;

    e.stopPropagation();

    // Create a plane at y=0 for dragging
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    // Calculate mouse position in normalized device coordinates
    raycaster.setFromCamera(e.pointer, camera);
    raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      // Update position
      onPositionChange(intersection.x, intersection.z);
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {/* Beer mesh with fallback */}
      <Suspense fallback={<FallbackCube isDragging={isDragging} />}>
        <BeerMesh />
      </Suspense>

      {/* Indicator ring at floor level */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.5, 32]} />
        <meshBasicMaterial
          color={isDragging ? '#ff0000' : '#00ff00'}
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        position={[0, 2, 0]}
        intensity={isDragging ? 2 : 1}
        distance={10}
        color={isDragging ? '#ff0000' : '#00ff00'}
      />
    </group>
  );
}

// Preload the mesh
useGLTF.preload('/psx_low_poly_beer.glb');
