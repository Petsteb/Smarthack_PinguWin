import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { FloorPlanViewer3D } from '@/components/3d/FloorPlanViewer3D';
import { FloorData } from '@/types';
import BookingCalendar from '@/components/Calendar';
import { bookingService, formatDateForAPI, createBookingRequest } from '@/services/booking';
import type { AvailabilityResponse, Room, Desk } from '@/services/booking';

export default function FloorPlanPage() {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);
  const [floorData, setFloorData] = useState<FloorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [resourceInfo, setResourceInfo] = useState<{ type: 'desk' | 'room', id: number } | null>(null);

  // Load floor plan data
  useEffect(() => {
    fetch('/floor_data.json')
      .then((res) => res.json())
      .then((data) => {
        setFloorData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading floor plan:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle object selection
  const handleObjectClick = async (objectName: string, objectType: string) => {
    setSelectedObject(objectName);
    setSelectedObjectType(objectType);
    setBookingMessage(null);
    setAvailability(null);
    setResourceInfo(null);

    // Try to match the selected object to a resource in the database
    // For desks: "desk-0" to "desk-191"
    // For rooms: "managementRoom-0", "teamMeetings-small-0", etc.
    const deskMatch = objectName.match(/^desk-(\d+)$/);
    const roomMatch = objectName.match(/^(managementRoom|beerPoint|billiard|wellbeing|trainingRoom\d+|teamMeetings-[\w-]+)-(\d+)$/) ||
      objectName.match(/^(managementRoom|beerPoint|billiard|wellbeing|trainingRoom\d+)$/);

    if (deskMatch) {
      const deskIndex = parseInt(deskMatch[1]);
      setResourceInfo({ type: 'desk', id: deskIndex + 1 }); // Database IDs start at 1
      await fetchAvailability('desk', deskIndex + 1, new Date());
    } else if (roomMatch || objectName.includes('teamMeetings')) {
      // For rooms, we need to fetch from the database to get the correct ID
      await fetchRoomInfo(objectName);
    }
  };

  // Fetch room info from database
  const fetchRoomInfo = async (roomName: string) => {
    try {
      const rooms = await bookingService.getAllRooms();
      const room = rooms.find(r => r.name === roomName);
      if (room) {
        setResourceInfo({ type: 'room', id: room.id });
        await fetchAvailability('room', room.id, new Date());
      }
    } catch (error) {
      console.error('Error fetching room info:', error);
    }
  };

  // Fetch availability for a resource
  const fetchAvailability = async (resourceType: 'desk' | 'room', resourceId: number, date: Date) => {
    setLoadingAvailability(true);
    try {
      const dateStr = formatDateForAPI(date);
      const availabilityData = await bookingService.checkAvailability(resourceType, resourceId, dateStr);
      setAvailability(availabilityData);
      setSelectedDate(date);
    } catch (error: any) {
      console.error('Error fetching availability:', error);
      setBookingMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to load availability'
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Get counts
  const roomCount = floorData ? Object.values(floorData).filter(obj => obj.room === 1).length : 0;
  const objectCount = floorData ? Object.keys(floorData).length - roomCount : 0;

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

  // Handle both direct object names, individual desk IDs (e.g., "desks1-0"), and teamMeetings sub-rooms
  const getSelectedObjectData = () => {
    if (!selectedObject || !floorData) return null;

    // First try direct lookup
    if (floorData[selectedObject]) {
      return floorData[selectedObject];
    }

    // Helper function to check if an object is within a space rectangle
    const isWithinSpace = (obj: any, space: any) => {
      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      return (
        objCenterX >= space.x &&
        objCenterX <= space.x + space.width &&
        objCenterY >= space.y &&
        objCenterY <= space.y + space.height
      );
    };

    // Check if it's a managementRoom individual room (e.g., "managementRoom-0")
    if (selectedObject.startsWith('managementRoom-')) {
      const index = parseInt(selectedObject.replace('managementRoom-', ''));
      const managementRoomData = floorData['managementRoom'];

      if (managementRoomData && Array.isArray(managementRoomData.space) && managementRoomData.space[index]) {
        const spaceRect = managementRoomData.space[index];

        // Filter chairs and tables based on coordinates within this space
        const chairsInSpace = managementRoomData.chairs
          ? managementRoomData.chairs.filter((chair: any) => isWithinSpace(chair, spaceRect))
          : [];

        const tablesInSpace = managementRoomData.tables
          ? managementRoomData.tables.filter((table: any) => isWithinSpace(table, spaceRect))
          : [];

        return {
          space: [spaceRect],
          room: 1,
          ...(chairsInSpace.length > 0 && { chairs: chairsInSpace }),
          ...(tablesInSpace.length > 0 && { tables: tablesInSpace })
        };
      }
    }

    // Check if it's a teamMeetings sub-room (e.g., "teamMeetings-small" or "teamMeetings-small-0")
    if (selectedObject.startsWith('teamMeetings-')) {
      const parts = selectedObject.replace('teamMeetings-', '').split('-');
      const teamMeetingsData = floorData['teamMeetings'];

      if (teamMeetingsData && typeof teamMeetingsData === 'object') {
        // Check for individual rooms like "teamMeetings-small-0"
        if (parts.length === 2) {
          const subKey = parts[0]; // e.g., "small"
          const index = parseInt(parts[1]); // e.g., 0
          const subRoomData = (teamMeetingsData as any)[subKey];

          if (subRoomData && Array.isArray(subRoomData.space) && subRoomData.space[index]) {
            const spaceRect = subRoomData.space[index];

            // Filter chairs and tables based on coordinates within this space
            const chairsInSpace = subRoomData.chairs
              ? subRoomData.chairs.filter((chair: any) => isWithinSpace(chair, spaceRect))
              : [];

            const tablesInSpace = subRoomData.tables
              ? subRoomData.tables.filter((table: any) => isWithinSpace(table, spaceRect))
              : [];

            // Return just this individual space rectangle with filtered furniture
            return {
              space: [spaceRect],
              room: 1,
              ...(chairsInSpace.length > 0 && { chairs: chairsInSpace }),
              ...(tablesInSpace.length > 0 && { tables: tablesInSpace })
            };
          }
        } else {
          // Single sub-room like "teamMeetings-round4"
          const subKey = parts[0];
          const subRoomData = (teamMeetingsData as any)[subKey];
          if (subRoomData) {
            return { ...subRoomData, room: 1 };
          }
        }
      }
    }

    // If not found, it might be an individual desk ID like "desks1-0"
    // Extract the base name by removing the last "-{number}" suffix
    const match = selectedObject.match(/^(.+)-\d+$/);
    if (match) {
      const baseName = match[1];
      if (floorData[baseName]) {
        return floorData[baseName];
      }
    }

    return null;
  };

  const selectedObjectData = getSelectedObjectData();

  const handleBooking = async (date: Date, time: string) => {
    if (!resourceInfo) {
      setBookingMessage({ type: 'error', text: 'No resource selected' });
      return;
    }

    try {
      // Calculate end time (1 hour later by default)
      const [hours, minutes] = time.split(':').map(Number);
      const endHours = hours + 1;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const bookingRequest = createBookingRequest(
        resourceInfo.type,
        resourceInfo.id,
        date,
        time,
        endTime
      );

      await bookingService.createBooking(bookingRequest);

      setBookingMessage({
        type: 'success',
        text: `Successfully booked ${availability?.resource_name || 'resource'} for ${time}-${endTime}`
      });

      // Refresh availability
      await fetchAvailability(resourceInfo.type, resourceInfo.id, date);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setBookingMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to create booking'
      });
    }
  };

  const allAvailableHours = availability?.all_slots || [];
  const occupiedHours = availability?.booked_slots || [];
  console.log(occupiedHours);

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
              <span className="font-semibold">{roomCount}</span> Rooms •{' '}
              <span className="font-semibold">{objectCount}</span> Objects
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - FloorPlanViewer3D now includes the filter panel */}
      <div className="flex-1 overflow-hidden">
        <FloorPlanViewer3D
          onObjectClick={handleObjectClick}
          selectedObject={selectedObject}
        />
      </div>

      {/* Sidebar - Object Details (overlay on top of the 3D viewer) */}
      {selectedObjectData && selectedObject && (
        <div className="absolute right-0 top-16 bottom-0 w-96 bg-white shadow-2xl overflow-y-auto z-20">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Details</h2>
              <button
                onClick={() => {
                  setSelectedObject(null);
                  setSelectedObjectType(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Name</label>
                <p className="text-lg font-medium text-gray-900">{selectedObject}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Type</label>
                <p className="text-gray-900 capitalize">
                  {selectedObjectData.room === 1 ? 'Room' : selectedObjectType}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Book This Space</label>

                {bookingMessage && (
                  <div className={`mb-4 p-3 rounded-lg ${bookingMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {bookingMessage.text}
                  </div>
                )}

                {loadingAvailability ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading availability...</p>
                  </div>
                ) : availability ? (
                  <BookingCalendar
                    onBook={handleBooking}
                    allAvailableHours={allAvailableHours}
                    bookedHours={occupiedHours}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>This space is not available for booking</p>
                  </div>
                )}
              </div>

              {/* {selectedObjectData.space && selectedObjectData.space.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Space Rectangles</label>
                  <p className="text-gray-900">{selectedObjectData.space.length} rectangle(s)</p>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {selectedObjectData.space.map((rect, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <span className="font-mono">
                          x: {rect.x.toFixed(1)}, y: {rect.y.toFixed(1)}, w: {rect.width.toFixed(1)}, h: {rect.height.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedObjectData.chairs && selectedObjectData.chairs.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Chairs</label>
                  <p className="text-gray-900">{selectedObjectData.chairs.length} chair(s)</p>
                </div>
              )}

              {selectedObjectData.chairsNormal && selectedObjectData.chairsNormal.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Chairs (Normal)</label>
                  <p className="text-gray-900">{selectedObjectData.chairsNormal.length} chair(s)</p>
                </div>
              )}

              {selectedObjectData.chairsElipsa && selectedObjectData.chairsElipsa.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Chairs (Elipsa)</label>
                  <p className="text-gray-900">{selectedObjectData.chairsElipsa.length} chair(s)</p>
                </div>
              )}

              {selectedObjectData.chairsEvantai && selectedObjectData.chairsEvantai.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Chairs (Evantai)</label>
                  <p className="text-gray-900">{selectedObjectData.chairsEvantai.length} chair(s)</p>
                </div>
              )}

              {selectedObjectData.tables && selectedObjectData.tables.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Tables</label>
                  <p className="text-gray-900">{selectedObjectData.tables.length} table(s)</p>
                </div>
              )} */}

              {selectedObjectData.room === 1 && (
                <div className="pt-4 border-t">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Book This Room
                  </button>
                </div>
              )}

              {!selectedObjectData.room && selectedObject.toLowerCase().includes('desk') && (
                <div className="pt-4 border-t">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Book This Desk
                  </button>
                </div>
              )}

              {/* <div className="pt-4 border-t">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Additional Info
                </label>
                <p className="text-xs text-gray-500">
                  {selectedObjectData.room === 1
                    ? 'This is a room area marked on the floor with a colored rectangle.'
                    : 'This object is rendered using 3D meshes based on its type.'}
                </p>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      {!selectedObjectData && (
        <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-xs z-10">
          <div className="flex items-start gap-2">
            <Info size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How to use</h3>
              <p className="text-sm text-gray-600 mb-2">
                Click on any object or room to view details. Use your mouse to rotate, pan, and zoom the 3D view.
              </p>
              <p className="text-xs text-gray-500">
                Use the filter panel on the right to show/hide specific rooms and objects.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
