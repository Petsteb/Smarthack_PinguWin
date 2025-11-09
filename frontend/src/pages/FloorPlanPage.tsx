import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Navigation as NavIcon } from 'lucide-react';
import { FloorPlanViewer3D } from '@/components/3d/FloorPlanViewer3D';
import { FloorData } from '@/types';
import BookingCalendar from '@/components/Calendar';
import { bookingService, formatDateForAPI, createBookingRequest } from '@/services/booking';
import type { AvailabilityResponse, Room, Desk } from '@/services/booking';

const FLOOR_CENTER_X = 89.6;
const FLOOR_CENTER_Z = 39.6;

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

  // Navigation state
  const [navigationEnabled, setNavigationEnabled] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState<{ x: number; z: number }>({
    x: FLOOR_CENTER_X,
    z: FLOOR_CENTER_Z,
  });
  const [navigationDestination, setNavigationDestination] = useState<{ x: number; z: number } | null>(null);

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

  // Calculate destination position for navigation
  const getObjectPosition = (objectName: string): { x: number; z: number } | null => {
    if (!floorData) return null;

    const scale = 0.05;

    // Handle individual desks (desk-0, desk-1, etc.)
    const deskMatch = objectName.match(/^desk-(\d+)$/);
    if (deskMatch) {
      const deskIndex = parseInt(deskMatch[1]);
      console.log(`Looking for desk index ${deskIndex}`);

      // Find the desk across all desk groups (must be in order: desks1, desks2, etc.)
      let currentIndex = 0;
      const deskGroups = Object.entries(floorData)
        .filter(([name]) => name.startsWith('desks'))
        .sort((a, b) => a[0].localeCompare(b[0])); // Sort to ensure order

      for (const [name, data] of deskGroups) {
        if (data.tables && Array.isArray(data.tables)) {
          console.log(`Checking ${name}, has ${data.tables.length} desks, current index: ${currentIndex}`);
          for (const table of data.tables) {
            if (currentIndex === deskIndex) {
              // Found the desk!
              const pos = {
                x: (table.x + table.width / 2) * scale,
                z: (table.y + table.height / 2) * scale,
              };
              console.log(`✅ Found desk ${deskIndex} in ${name} at position:`, pos);
              return pos;
            }
            currentIndex++;
          }
        }
      }
      console.warn(`❌ Desk ${deskIndex} not found in any desk group`);
      return null;
    }

    // Handle regular objects with direct names
    const selectedData = floorData[objectName];
    if (selectedData && selectedData.space && selectedData.space.length > 0) {
      // Use the center of the first space rectangle
      const space = selectedData.space[0];
      return {
        x: (space.x + space.width / 2) * scale,
        z: (space.y + space.height / 2) * scale,
      };
    }

    // For split rooms like managementRoom-0, teamMeetings-small-0, etc.
    if (objectName.startsWith('managementRoom-')) {
      const index = parseInt(objectName.split('-')[1]);
      const managementData = floorData['managementRoom'];
      if (managementData && managementData.space && managementData.space[index]) {
        const space = managementData.space[index];
        return {
          x: (space.x + space.width / 2) * scale,
          z: (space.y + space.height / 2) * scale,
        };
      }
    }

    if (objectName.startsWith('teamMeetings-')) {
      const parts = objectName.replace('teamMeetings-', '').split('-');
      const teamMeetingsData = floorData['teamMeetings'] as any;

      if (parts.length === 2) {
        // e.g., teamMeetings-small-0
        const subKey = parts[0]; // "small"
        const index = parseInt(parts[1]); // 0
        const subData = teamMeetingsData?.[subKey];
        if (subData && subData.space && subData.space[index]) {
          const space = subData.space[index];
          return {
            x: (space.x + space.width / 2) * scale,
            z: (space.y + space.height / 2) * scale,
          };
        }
      } else if (parts.length === 1) {
        // e.g., teamMeetings-round4
        const subKey = parts[0];
        const subData = teamMeetingsData?.[subKey];
        if (subData && subData.space && subData.space[0]) {
          const space = subData.space[0];
          return {
            x: (space.x + space.width / 2) * scale,
            z: (space.y + space.height / 2) * scale,
          };
        }
      }
    }

    console.warn(`Could not find position for ${objectName}`);
    return null;
  };

  // Handle navigation to selected object
  const handleNavigateToObject = () => {
    if (!selectedObject) return;

    console.log('Navigating to:', selectedObject);
    const destination = getObjectPosition(selectedObject);
    console.log('Destination position:', destination);
    console.log('Avatar position:', avatarPosition);

    if (destination) {
      setNavigationDestination(destination);
      setNavigationEnabled(true);
      console.log('Navigation destination set:', destination);
    } else {
      console.warn('Could not calculate destination for', selectedObject);
    }
  };

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
      setResourceInfo({ type: 'desk', id: deskIndex }); // Database IDs start at 1
      await fetchAvailability('desk', deskIndex + 1, new Date());
    }
    // else if (roomMatch || objectName.includes('teamMeetings')) {
    //   // For rooms, we need to fetch from the database to get the correct ID
    //   await fetchRoomInfo(objectName);
    // }
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
            {/* Navigation Toggle (Dev Tool) */}
            <button
              onClick={() => {
                setNavigationEnabled(!navigationEnabled);
                if (navigationEnabled) {
                  setNavigationDestination(null);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                navigationEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <NavIcon size={18} />
              <span>{navigationEnabled ? 'Navigation ON' : 'Navigation OFF'}</span>
            </button>

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
          navigationEnabled={navigationEnabled}
          navigationDestination={navigationDestination}
          avatarPosition={avatarPosition}
          onAvatarPositionChange={(x, z) => setAvatarPosition({ x, z })}
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

              {/* Navigation Button */}
              {navigationEnabled && (
                <div>
                  <button
                    onClick={handleNavigateToObject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <NavIcon size={20} />
                    <span>Navigate to This Location</span>
                  </button>
                  {navigationDestination && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Path will update in real-time as you drag the avatar
                    </p>
                  )}
                </div>
              )}

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
