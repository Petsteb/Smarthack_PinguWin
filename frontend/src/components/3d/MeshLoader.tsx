import { useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { MeshConfig } from '@/types';

interface MeshLoaderProps {
  type: string;
  config: MeshConfig;
  position: [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * MeshLoader component - Loads and displays 3D meshes based on file type
 * Supports GLB, GLTF, FBX, and OBJ formats
 */
export function MeshLoader({ type, config, position, onClick, isSelected }: MeshLoaderProps) {
  const [meshPath, setMeshPath] = useState<string | null>(null);
  const [meshFormat, setMeshFormat] = useState<'glb' | 'gltf' | 'fbx' | 'obj' | null>(null);
  const [fallback, setFallback] = useState(false);

  // Determine which mesh file exists
  useEffect(() => {
    const formats: Array<'glb' | 'gltf' | 'fbx' | 'obj'> = ['glb', 'gltf', 'fbx', 'obj'];
    const basePath = `/assets/meshes/${config.file}`;

    // Try to find the first available format
    const checkFormat = async () => {
      for (const format of formats) {
        const path = `${basePath}.${format}`;
        try {
          const response = await fetch(path, { method: 'HEAD' });
          if (response.ok) {
            setMeshPath(path);
            setMeshFormat(format);
            return;
          }
        } catch (error) {
          // File doesn't exist, try next format
          continue;
        }
      }
      // No mesh found, use fallback
      console.warn(`No mesh found for type "${type}". Using fallback geometry.`);
      setFallback(true);
    };

    checkFormat();
  }, [config.file, type]);

  // Render fallback geometry if no mesh is found
  if (fallback) {
    return (
      <mesh
        position={position}
        onClick={onClick}
        scale={config.scale}
        rotation={config.rotation}
      >
        <boxGeometry args={[1, 0.5, 1]} />
        <meshStandardMaterial
          color={config.color}
          opacity={config.opacity || 1}
          transparent={!!config.opacity}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
    );
  }

  // Wait for mesh path to be determined
  if (!meshPath || !meshFormat) {
    return null;
  }

  // Render appropriate mesh loader based on format
  return (
    <LoadedMesh
      path={meshPath}
      format={meshFormat}
      config={config}
      position={position}
      onClick={onClick}
      isSelected={isSelected}
    />
  );
}

interface LoadedMeshProps {
  path: string;
  format: 'glb' | 'gltf' | 'fbx' | 'obj';
  config: MeshConfig;
  position: [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
}

function LoadedMesh({ path, format, config, position, onClick, isSelected }: LoadedMeshProps) {
  try {
    let model: any;

    switch (format) {
      case 'glb':
      case 'gltf':
        // eslint-disable-next-line react-hooks/rules-of-hooks
        model = useLoader(GLTFLoader, path);
        break;
      case 'fbx':
        // eslint-disable-next-line react-hooks/rules-of-hooks
        model = useLoader(FBXLoader, path);
        break;
      case 'obj':
        // eslint-disable-next-line react-hooks/rules-of-hooks
        model = useLoader(OBJLoader, path);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const scene = format === 'glb' || format === 'gltf' ? model.scene : model;

    // Clone the scene to allow multiple instances
    const clonedScene = scene.clone();

    // Apply color/material if needed
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Preserve original material but add selection highlight
        if (isSelected) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color('#ffffff');
          child.material.emissiveIntensity = 0.3;
        }

        // Apply opacity for rooms
        if (config.opacity !== undefined) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = config.opacity;
        }
      }
    });

    return (
      <primitive
        object={clonedScene}
        position={[
          position[0] + config.offset[0],
          position[1] + config.offset[1],
          position[2] + config.offset[2],
        ]}
        scale={config.scale}
        rotation={config.rotation}
        onClick={onClick}
      />
    );
  } catch (error) {
    console.error(`Error loading mesh from ${path}:`, error);

    // Fallback to simple geometry on error
    return (
      <mesh
        position={position}
        onClick={onClick}
        scale={config.scale}
        rotation={config.rotation}
      >
        <boxGeometry args={[1, 0.5, 1]} />
        <meshStandardMaterial
          color={config.color}
          opacity={config.opacity || 1}
          transparent={!!config.opacity}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
    );
  }
}

export default MeshLoader;
