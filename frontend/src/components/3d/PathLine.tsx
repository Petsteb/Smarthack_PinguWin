/**
 * Path Visualization Component
 * Renders a line from avatar to destination
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Point2D } from '@/utils/pathfinding';

interface PathLineProps {
  path: Point2D[] | null;
  color?: string;
  lineWidth?: number;
}

export function PathLine({ path, color = '#00ffff', lineWidth = 4 }: PathLineProps) {
  const points = useMemo(() => {
    if (!path || path.length === 0) return [];

    // Convert 2D path points to 3D points (y=0.5 to be slightly above floor)
    return path.map(p => new THREE.Vector3(p.x, 0.5, p.z));
  }, [path]);

  if (!path || points.length < 2) return null;

  return (
    <group>
      {/* Dark outline (thicker black line underneath) */}
      <Line
        points={points}
        color="#000000"
        lineWidth={lineWidth + 2}
        transparent
        opacity={0.6}
      />

      {/* Main path line (cyan on top) */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={0.9}
      />

      {/* Waypoint markers */}
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Destination marker (larger sphere at end) */}
      {points.length > 0 && (
        <mesh position={points[points.length - 1]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Start marker (at avatar position) */}
      {points.length > 0 && (
        <mesh position={points[0]}>
          <coneGeometry args={[0.5, 1, 8]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}
