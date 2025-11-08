# Floor Plan Editor & 3D Viewer Guide

I've created two interactive HTML tools for you to work with your floor plan SVG:

## 1. Floor Plan Editor (`floor_editor.html`)

This is an interactive 2D editor where you can select rooms and objects as polygons.

### Features:
- **Interactive Polygon Selection**: Click points on the floor plan to create polygons
- **Object Categorization**: Label each polygon as:
  - Room
  - Chair
  - Desk
  - Table
  - Wall
  - Door
- **Room Assignment**: Assign objects to specific rooms
- **Visual Feedback**: Different colors for different object types
- **Export Data**: Export all polygons and their locations as JSON

### How to Use:

1. **Open the Editor**:
   - Open `floor_editor.html` in your web browser
   - The SVG floor plan will load automatically

2. **Create Polygons**:
   - Select the item type from the dropdown (Room, Chair, Desk, etc.)
   - Enter a name for the item
   - Click points on the canvas to create a polygon
   - Press **Enter** or click "Finish Polygon" when done
   - Press **Esc** to cancel

3. **Assign Objects to Rooms**:
   - First, create room polygons
   - Then, when creating objects (chairs, desks, etc.), select which room they belong to from the "Room Assignment" dropdown

4. **Export Your Data**:
   - Click "Export Data" to download a JSON file
   - This file contains all rooms and objects with their polygon coordinates

### Keyboard Shortcuts:
- **Enter**: Finish current polygon
- **Esc**: Cancel current polygon

### Color Coding:
- 🟢 **Rooms**: Teal/Cyan
- 🟡 **Chairs**: Yellow
- 🟠 **Desks**: Orange
- 🟣 **Tables**: Purple
- ⚫ **Walls**: Gray
- 🔵 **Doors**: Blue

---

## 2. 3D Floor Plan Viewer (`floor_viewer_3d.html`)

This is a 3D viewer that displays your floor plan data in an interactive 3D environment.

### Features:
- **3D Visualization**: See your floor plan in 3D with procedural 3D models
- **Interactive Camera**: Rotate, zoom, and pan around the scene
- **Filtering Options**:
  - Filter by object type (show/hide chairs, desks, tables, etc.)
  - Filter by name (search)
  - Filter by room
- **Statistics**: View counts of objects and rooms
- **Wireframe Mode**: Toggle wireframe view

### How to Use:

1. **Load Your Data**:
   - Open `floor_viewer_3d.html` in your web browser
   - Click "Choose File" and select the JSON file you exported from the editor

2. **Navigate the 3D View**:
   - **Rotate**: Left-click and drag
   - **Zoom**: Scroll wheel
   - **Pan**: Right-click and drag

3. **Filter Objects**:
   - Use the checkboxes to show/hide object types
   - Enter text in the "Search by name" field to filter by name
   - Select a room from the dropdown to only show objects in that room

4. **Camera Controls**:
   - Click "Reset Camera" to return to the default view
   - Click "Toggle Wireframe" to switch between solid and wireframe rendering

### 3D Models:
Each object type is represented with a procedurally generated 3D model:
- **Rooms**: Flat polygons on the floor (semi-transparent)
- **Chairs**: Seat + backrest + 4 legs
- **Desks**: Desktop + 4 legs
- **Tables**: Round tabletop + 4 legs
- **Walls**: Extruded polygons (vertical structures)
- **Doors**: Door frame

---

## Workflow:

1. **Open `floor_editor.html`**
2. **Create polygons** for all rooms and objects in your floor plan
3. **Export** the data as JSON
4. **Open `floor_viewer_3d.html`**
5. **Load** the exported JSON file
6. **Explore** your floor plan in 3D with filtering options

---

## Technical Details:

### Floor Editor:
- Pure HTML/CSS/JavaScript
- Canvas-based drawing
- Exports JSON with polygon coordinates and metadata

### 3D Viewer:
- Built with **Three.js** (loaded from CDN)
- WebGL-based 3D rendering
- Procedural geometry for all object types
- Orbit controls for camera manipulation

### Data Format:
```json
{
  "rooms": [
    {
      "id": "unique_id",
      "name": "Room Name",
      "type": "room",
      "polygon": [{"x": 100, "y": 200}, ...],
      "bounds": {
        "minX": 100,
        "maxX": 500,
        "minY": 200,
        "maxY": 600,
        "centerX": 300,
        "centerY": 400,
        "width": 400,
        "height": 400
      }
    }
  ],
  "objects": [
    {
      "id": "unique_id",
      "name": "Object Name",
      "type": "chair|desk|table|wall|door",
      "polygon": [...],
      "bounds": {...},
      "room": "room_id",
      "roomName": "Room Name"
    }
  ]
}
```

---

## Browser Compatibility:

Both tools require a modern web browser with:
- Canvas API support (for the editor)
- WebGL support (for the 3D viewer)
- ES6 Module support (for Three.js import)

Tested on:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

---

## Tips:

1. **Start with rooms first** - Define all room boundaries before adding objects
2. **Be precise with clicks** - Zoom in on the SVG if needed for accurate polygon creation
3. **Use descriptive names** - This makes filtering easier in the 3D viewer
4. **Save your JSON** - Keep the exported JSON file as a backup of your work
5. **Experiment with filters** - Try different filter combinations in the 3D viewer to analyze your floor plan

---

## Troubleshooting:

**SVG not loading?**
- Make sure `floor_plan.svg` is in the same directory as `floor_editor.html`

**3D viewer shows nothing?**
- Make sure you've loaded a valid JSON file exported from the editor
- Check the browser console for errors

**Performance issues?**
- If you have many objects, try filtering to reduce the visible count
- Use wireframe mode for better performance

---

Enjoy mapping your floor plan! 🏢
