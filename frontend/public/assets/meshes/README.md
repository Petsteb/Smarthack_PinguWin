# 3D Mesh Assets

This folder contains all 3D mesh files used for visualizing objects in the floor plan.

## ✅ RECOMMENDED FORMAT: GLB

**Use `.glb` format** for best results:
- ✅ Best supported by Three.js
- ✅ Binary format (faster loading)
- ✅ Self-contained (materials/textures embedded)
- ✅ Industry standard for web 3D

## 📁 Required Mesh Files

Place your `.glb` mesh files in this folder with these names:

### Object Types (from automatic classification)
- `room.glb` - Large spaces/rooms (100+ width AND height)
- `desk.glb` - Desks and workstations (50-100 width, 30-120 height)
- `chair.glb` - Chairs (10-50 width, 15-60 height)
- `table.glb` - Tables (30-80 width/height, square-ish)
- `door.glb` - Doors (small thin objects, max 30, high aspect ratio)
- `generic.glb` - Fallback for unclassified objects (optional)

## 📐 Mesh Positioning

**IMPORTANT:** All meshes are automatically positioned at the **CENTER** of their bounding boxes.

- The system reads your `out.json` file
- Calculates the center point: `(x + width/2, y + height/2)`
- Places the mesh at that center in 3D space
- You don't need to manually adjust positions!

## 🎨 Mesh Requirements

- **Scale**: Design meshes at real-world scale (1 unit = 1 meter is good practice)
- **Origin**: Place the mesh origin at the base center
- **Orientation**:
  - Forward: +Z axis
  - Up: +Y axis
  - Right: +X axis
- **Optimization**: Keep polygon count reasonable (<10k triangles per object)
- **Materials**: Include embedded materials/textures in GLB format

## ⚙️ Configuration Files

### `mesh-config.json`
Configure scale, rotation, and Y-offset for each mesh type:
```json
{
  "desk": {
    "file": "desk",
    "scale": [1, 1, 1],
    "rotation": [0, 0, 0],
    "offset": [0, 0.5, 0],  // Y offset lifts mesh off ground
    "color": "#FF6B6B"
  }
}
```

### `object-type-mapping.json`
Customize automatic object classification rules based on dimensions:
```json
{
  "classification_rules": {
    "rules": [
      {
        "type": "desk",
        "mesh": "desk",
        "conditions": {
          "min_width": 50,
          "max_width": 100,
          "min_height": 30,
          "max_height": 120
        }
      }
    ]
  }
}
```

## 🔧 Manual Object Mapping

If automatic classification isn't perfect, you can manually map specific objects:

Add to `object-type-mapping.json`:
```json
{
  "manual_mappings": [
    {
      "index": 0,
      "type": "room",
      "name": "Conference Room A"
    },
    {
      "index": 5,
      "type": "chair",
      "name": "Executive Chair"
    }
  ]
}
```

## 📊 Supported Formats (in order of preference)

1. **GLB** (Recommended) - Binary GLTF
2. **GLTF** - Text-based GLTF
3. **FBX** - Autodesk format
4. **OBJ** - Wavefront (needs .mtl for materials)

The system will automatically try each format until it finds one that exists.

## 📝 File Naming Convention

The system looks for files in this order:
1. `{type}.glb`
2. `{type}.gltf`
3. `{type}.fbx`
4. `{type}.obj`

Examples:
- `desk.glb` ← **Use this!**
- `chair.glb`
- `table.glb`

## 🚨 Fallback Behavior

If a mesh file is not found, the system will:
1. Display a colored cube placeholder
2. Log a warning in the browser console
3. Continue loading other objects

Check the console for warnings like:
```
No mesh found for type "desk". Using fallback geometry.
```

## 📏 Scale Adjustment

If your meshes appear too large or too small:

1. Open `mesh-config.json`
2. Adjust the `scale` value for that mesh type:
   ```json
   "scale": [2, 2, 2]  // Double the size
   "scale": [0.5, 0.5, 0.5]  // Half the size
   ```

## 🔄 Y-Offset (Height Adjustment)

Meshes might appear buried in the ground. Adjust the Y offset:

```json
"offset": [0, 1.5, 0]  // Lifts mesh 1.5 units up
```

## 🎯 Example Directory Structure

```
frontend/public/assets/meshes/
├── README.md (this file)
├── mesh-config.json
├── object-type-mapping.json
├── room.glb ✓
├── chair.glb ✓
├── desk.glb ✓
├── table.glb ✓
├── door.glb ✓
└── generic.glb (optional)
```

## 🧪 Testing Your Meshes

After placing mesh files:

1. Reload the 3D floor viewer: `http://localhost:5173/floor-plan`
2. Check the browser console for any loading errors
3. Click on objects to verify they're classified correctly
4. Adjust `scale` and `offset` in `mesh-config.json` if needed

## 📈 Classification Stats

When you load the floor plan, the console will show:
```
Object Classification Stats: {
  room: 3,
  desk: 40,
  chair: 120,
  table: 5
}
```

## ❓ Troubleshooting

**Q: Meshes not appearing?**
- Check file names match exactly (case-sensitive)
- Check file format is supported
- Check browser console for errors

**Q: Meshes at wrong location?**
- Meshes are automatically centered. If they still seem off, the `out.json` coordinates might be incorrect.

**Q: Meshes too big/small?**
- Adjust `scale` in `mesh-config.json`

**Q: Meshes buried in ground?**
- Increase Y value in `offset`: `[0, 1.0, 0]`

**Q: Wrong object classification?**
- Use `manual_mappings` in `object-type-mapping.json`
- Or adjust classification rules

## 📞 Need Help?

Check that:
- File names match exactly (no spaces, correct extension)
- Files are valid GLB/GLTF/FBX/OBJ format
- Files are not corrupted (try opening in Blender)
- Console shows no CORS or loading errors

Happy mapping! 🏢
