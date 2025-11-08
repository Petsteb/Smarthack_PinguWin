# 🎨 3D Mesh Setup Guide

## ✅ Format Recommendation: GLB

**You should use `.glb` format** (which you already have!) because:
- Best supported by Three.js
- Binary format (faster)
- Self-contained (textures embedded)
- Industry standard

## 📁 Current Mesh Files

I can see you already have these mesh files:
- ✅ `desk.glb`
- ✅ `lowpoly_office_chair.glb`
- ✅ `basic_low_poly_wall_with_a_baseboard.glb`
- ✅ `low_poly_pool_table.glb`

## 🔧 Required Renaming

To make them work with the automatic classification system, rename your files like this:

### Current → Required Name

```bash
cd frontend/public/assets/meshes/

# Rename these files:
lowpoly_office_chair.glb → chair.glb
# desk.glb is already correct! ✓
basic_low_poly_wall_with_a_baseboard.glb → wall.glb  (or door.glb)
low_poly_pool_table.glb → table.glb
```

### Windows Commands:
```cmd
cd frontend\public\assets\meshes
ren lowpoly_office_chair.glb chair.glb
ren basic_low_poly_wall_with_a_baseboard.glb wall.glb
ren low_poly_pool_table.glb table.glb
```

## 📋 Required Mesh Files

After renaming, you should have:

- ✅ `desk.glb` - Already correct!
- ⏳ `chair.glb` - Rename from lowpoly_office_chair.glb
- ⏳ `table.glb` - Rename from low_poly_pool_table.glb
- ⏳ `wall.glb` OR `door.glb` - Rename from basic_low_poly_wall_with_a_baseboard.glb
- ❌ `room.glb` - You need to add this (or it will use colored floor planes)

## 🎯 How Objects Are Classified

Your `out.json` has 45 objects. They'll be automatically classified as:

| Size Range | Type | Your Mesh |
|-----------|------|-----------|
| 100+ width & height | room | `room.glb` (fallback cube) |
| 50-100 width, 30-120 height | desk | ✅ `desk.glb` |
| 10-50 width, 15-60 height | chair | `chair.glb` (rename) |
| 30-80 square-ish | table | `table.glb` (rename) |
| Small thin (aspect ratio >2) | door | `door.glb` or `wall.glb` |

## 📐 Mesh Positioning

**IMPORTANT:** All meshes are automatically placed at the **CENTER** of their bounding boxes!

Example:
- Object at `x: 516, y: 1045, width: 89, height: 110`
- Center: `x: 560.5, y: 1100` (calculated as x + width/2, y + height/2)
- Mesh is placed at that center point in 3D space

**You don't need to adjust positions manually!**

## ⚙️ Configuration

### Adjust Scale (if meshes too big/small)

Edit `frontend/public/assets/meshes/mesh-config.json`:

```json
{
  "chair": {
    "scale": [1.5, 1.5, 1.5]  // Make 50% bigger
  }
}
```

### Adjust Height (if buried in ground)

```json
{
  "desk": {
    "offset": [0, 1.0, 0]  // Lift 1 unit up
  }
}
```

## 🚀 Testing

1. **Rename files** as shown above
2. **Run frontend**:
   ```bash
   cd frontend
   npm install  # If not done already
   npm run dev
   ```
3. **Open browser**: http://localhost:5173/floor-plan
4. **Check console** for classification stats:
   ```
   Object Classification Stats: { room: 3, desk: 12, chair: 25, table: 5 }
   ```

## 🎨 What You'll See

- Objects will load with your custom meshes
- Click any object to see details
- Rotate/pan/zoom with mouse
- Meshes centered perfectly on each object's location

## 🔍 Debugging

If meshes don't appear:
1. Check file names match exactly: `chair.glb` not `Chair.glb`
2. Check browser console for errors
3. Try a different mesh if one is corrupted
4. Use the fallback cube as reference

## 📝 Optional: Manual Mapping

If automatic classification isn't perfect, edit `frontend/public/assets/meshes/object-type-mapping.json`:

```json
{
  "manual_mappings": [
    {
      "index": 0,
      "type": "room",
      "name": "Main Conference Room"
    }
  ]
}
```

The `index` matches the position in your out.json array (0-based).

## ✨ Next Steps

After renaming and testing:
1. Adjust scales in `mesh-config.json` if needed
2. Adjust Y offsets if meshes buried/floating
3. Add more mesh files for better variety
4. Customize classification rules if needed

Happy 3D mapping! 🏢
