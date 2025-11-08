import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Maximize2 } from 'lucide-react';
import { FloorPlanViewer3D } from '@/components/3d/FloorPlanViewer3D';
import { FloorPlanData } from '@/types';

export default function FloorPlanPage() {
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [selectedObjectData, setSelectedObjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load floor plan JSON data
  useEffect(() => {
    fetch('/floor_plan_data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load floor plan data');
        return res.json();
      })
      .then((data) => {
        setFloorPlanData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading floor plan:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle object selection
  const handleObjectClick = (objectId: string, objectType: string) => {
    setSelectedObject(objectId);

    // Find the selected object data
    if (!floorPlanData) return;

    let objData = null;
    if (objectType === 'room') {
      objData = floorPlanData.rooms.find((r) => r.id === objectId);
    } else {
      objData = floorPlanData.objects.find((o) => o.id === objectId);
    }

    setSelectedObjectData(objData);
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

  if (error || !floorPlanData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error: {error || 'Failed to load floor plan'}</p>
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
              <span className="font-semibold">{floorPlanData.rooms.length}</span> Rooms
              {floorPlanData.objects.length > 0 && (
                <>
                  {' | '}
                  <span className="font-semibold">{floorPlanData.objects.length}</span> Objects
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <FloorPlanViewer3D
            floorPlanData={floorPlanData}
            onObjectClick={handleObjectClick}
            selectedObjectId={selectedObject}
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
                    setSelectedObject(null);
                    setSelectedObjectData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Name</label>
                  <p className="text-lg font-medium text-gray-900">{selectedObjectData.name}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Type</label>
                  <p className="text-gray-900 capitalize">{selectedObjectData.type}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">ID</label>
                  <p className="text-xs text-gray-600 font-mono">{selectedObjectData.id}</p>
                </div>

                {selectedObjectData.roomName && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Room</label>
                    <p className="text-gray-900">{selectedObjectData.roomName}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-600">Dimensions</label>
                  <p className="text-gray-900">
                    {selectedObjectData.bounds.width.toFixed(1)} ×{' '}
                    {selectedObjectData.bounds.height.toFixed(1)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Center Position</label>
                  <p className="text-gray-900 font-mono text-sm">
                    x: {selectedObjectData.bounds.centerX.toFixed(1)}, y:{' '}
                    {selectedObjectData.bounds.centerY.toFixed(1)}
                  </p>
                </div>

                {selectedObjectData.type === 'room' && (
                  <div className="pt-4 border-t">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                      Book This Room
                    </button>
                  </div>
                )}
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
              <p className="text-sm text-gray-600">
                Click on any room or object to view details and book. Use your mouse to rotate,
                pan, and zoom the 3D view.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
