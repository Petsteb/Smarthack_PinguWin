import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { FloorPlanViewer3D } from '@/components/3d/FloorPlanViewer3D';
import { FloorPlanData, EnhancedBoundingBox } from '@/types';
import { classifyObjects } from '@/utils/objectClassifier';

export default function FloorPlanPage() {
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null);
  const [selectedObjectData, setSelectedObjectData] = useState<EnhancedBoundingBox | null>(null);
  const [allObjects, setAllObjects] = useState<EnhancedBoundingBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load floor plan data and classify objects
  useEffect(() => {
    Promise.all([
      fetch('/out.json').then((res) => res.json()),
      fetch('/assets/meshes/object-type-mapping.json').then((res) => res.json()),
    ])
      .then(([floorData, typeMappingData]) => {
        const classified = classifyObjects(floorData, typeMappingData);
        setAllObjects(classified);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading floor plan:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle object selection
  const handleObjectClick = (objectIndex: number, objectType: string) => {
    setSelectedObjectIndex(objectIndex);

    // Find the selected object data
    const objData = allObjects.find((o) => o.index === objectIndex);
    setSelectedObjectData(objData || null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading Floor Plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error: {error}</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">3D Floor Plan Viewer</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{allObjects.length}</span> Objects Loaded
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <FloorPlanViewer3D
            onObjectClick={handleObjectClick}
            selectedObjectIndex={selectedObjectIndex}
          />
        </div>

        {/* Sidebar - Object Details */}
        {selectedObjectData && (
          <div className="w-80 bg-white shadow-lg overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Object Details</h2>
                <button
                  onClick={() => {
                    setSelectedObjectIndex(null);
                    setSelectedObjectData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Index</label>
                  <p className="text-lg font-medium text-gray-900">#{selectedObjectData.index}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Type</label>
                  <p className="text-gray-900 capitalize">{selectedObjectData.type}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Mesh</label>
                  <p className="text-gray-900 capitalize">{selectedObjectData.mesh}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Position (2D)</label>
                  <p className="text-gray-900 font-mono text-sm">
                    x: {selectedObjectData.x.toFixed(1)}, y: {selectedObjectData.y.toFixed(1)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Size</label>
                  <p className="text-gray-900">
                    {selectedObjectData.width.toFixed(1)} × {selectedObjectData.height.toFixed(1)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Center Point</label>
                  <p className="text-gray-900 font-mono text-sm">
                    x: {selectedObjectData.centerX.toFixed(1)}, y:{' '}
                    {selectedObjectData.centerY.toFixed(1)}
                  </p>
                </div>

                {(selectedObjectData.type === 'room' || selectedObjectData.type === 'desk') && (
                  <div className="pt-4 border-t">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                      Book This {selectedObjectData.type === 'room' ? 'Room' : 'Desk'}
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    3D Position
                  </label>
                  <p className="text-xs text-gray-500">
                    Mesh is placed at the CENTER of the bounding box in 3D space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      {!selectedObjectData && (
        <div className="absolute top-20 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-start gap-2">
            <Info size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How to use</h3>
              <p className="text-sm text-gray-600 mb-2">
                Click on any object to view details. Use your mouse to rotate, pan, and zoom the
                3D view.
              </p>
              <p className="text-xs text-gray-500">
                Objects are automatically classified based on their dimensions. You can customize
                the classification rules in object-type-mapping.json.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
