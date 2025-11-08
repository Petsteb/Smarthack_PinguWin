# 3D Mesh Assets

This folder contains all 3D mesh files used for visualizing objects in the floor plan.

## Supported Formats

The 3D viewer supports the following mesh formats:
- **GLB/GLTF** (recommended) - Compact, efficient format
- **FBX** - Autodesk format
- **OBJ** - Wavefront format (with .mtl materials)

## Required Mesh Files

Based on your floor plan data, place your mesh files here with these exact names:

### Room Types
- `room.glb` (or `.gltf`, `.fbx`, `.obj`) - Generic room floor

### Object Types
- `chair.glb` - Chair model
- `desk.glb` - Desk model
- `table.glb` - Table model
- `wall.glb` - Wall model
- `door.glb` - Door model

## File Naming Convention

The system will automatically detect the format based on the file extension:
1. First priority: `.glb`
2. Second priority: `.gltf`
3. Third priority: `.fbx`
4. Fourth priority: `.obj`

## Adding Custom Object Types

If you have additional object types in your JSON (like `conference_table`, `whiteboard`, etc.):

1. Add the mesh file with the same name as the `type` field in your JSON
   - Example: If JSON has `"type": "conference_table"`, name your file `conference_table.glb`

2. Update `mesh-config.json` in this folder to define scale, rotation, and offset

## Mesh Requirements

- **Scale**: Design your meshes at real-world scale (1 unit = 1 meter)
- **Origin**: Place origin at the base center of the object
- **Orientation**: Face forward along +Z axis, up along +Y axis
- **Optimization**: Keep polygon count reasonable (<10k triangles per object)
- **Materials**: Include embedded materials/textures in GLB/GLTF format

## Example Directory Structure

```
meshes/
├── README.md (this file)
├── mesh-config.json
├── room.glb
├── chair.glb
├── desk.glb
├── table.glb
├── wall.glb
├── door.glb
└── [your custom types].glb
```

## Testing Your Meshes

After placing mesh files:
1. Reload the 3D floor viewer
2. Check the browser console for any loading errors
3. Adjust scale/rotation in `mesh-config.json` if needed

## Fallback Behavior

If a mesh file is not found, the system will:
1. Display a placeholder cube with the object's color
2. Log a warning in the console
3. Continue loading other objects

## Need Help?

Check that:
- File names match exactly (case-sensitive)
- File formats are supported
- Meshes are not corrupted (try opening in Blender/3D viewer)
- File paths are correct
