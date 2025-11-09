import api from './api';

// ============================================================================
// Types
// ============================================================================

export interface Booking {
  id: number;
  user_id: number;
  resource_type: 'desk' | 'room';
  resource_id: number;
  resource_name: string;
  start_time: string;
  end_time: string;
  pending: boolean;
  duration_minutes: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_past: boolean;
  desk_id?: number | null;
  room_id?: number | null;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface CreateBookingRequest {
  resource_type: 'desk' | 'room';
  resource_id: number;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
}

export interface UpdateBookingRequest {
  start_time?: string;
  end_time?: string;
  pending?: boolean;
}

export interface Desk {
  id: number;
  position_name: string;
  occupied: boolean;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  occupied: boolean;
  type_id: number;
  type_name: string | null;
  requires_approval: boolean;
}

export interface AvailabilityResponse {
  resource_type: string;
  resource_id: number;
  resource_name: string;
  date: string;
  all_slots: string[];
  booked_slots: string[];
  available_slots: string[];
}

// ============================================================================
// Booking Service
// ============================================================================

export const bookingService = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await api.post('/api/bookings/', data);
    return response.data;
  },

  /**
   * Get current user's bookings
   */
  async getMyBookings(
    page: number = 1,
    pageSize: number = 10,
    upcomingOnly: boolean = false
  ): Promise<BookingListResponse> {
    const response = await api.get('/api/bookings/my-bookings', {
      params: {
        page,
        page_size: pageSize,
        upcoming_only: upcomingOnly,
      },
    });
    return response.data;
  },

  /**
   * Get a specific booking by ID
   */
  async getBooking(bookingId: number): Promise<Booking> {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Update a booking
   */
  async updateBooking(bookingId: number, data: UpdateBookingRequest): Promise<Booking> {
    const response = await api.put(`/api/bookings/${bookingId}`, data);
    return response.data;
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: number): Promise<void> {
    await api.delete(`/api/bookings/${bookingId}`);
  },

  /**
   * Get all desks
   */
  async getAllDesks(): Promise<Desk[]> {
    const response = await api.get('/api/bookings/resources/desks');
    return response.data;
  },

  /**
   * Get all rooms
   */
  async getAllRooms(): Promise<Room[]> {
    const response = await api.get('/api/bookings/resources/rooms');
    return response.data;
  },

  /**
   * Check availability for a resource on a specific date
   */
  async checkAvailability(
    resourceType: 'desk' | 'room',
    resourceId: number,
    date: string // YYYY-MM-DD format
  ): Promise<AvailabilityResponse> {
    const response = await api.get(
      `/api/bookings/availability/${resourceType}/${resourceId}`,
      {
        params: { check_date: date },
      }
    );
    return response.data;
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create a datetime string from date and time
 */
export function createDateTimeString(date: Date, time: string): string {
  const dateStr = formatDateForAPI(date);
  return `${dateStr}T${time}:00Z`;
}

/**
 * Parse time slot to get hours and minutes
 */
export function parseTimeSlot(timeSlot: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Create a booking request from date and time slots
 */
export function createBookingRequest(
  resourceType: 'desk' | 'room',
  resourceId: number,
  date: Date,
  startTime: string,
  endTime: string
): CreateBookingRequest {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    start_time: createDateTimeString(date, startTime),
    end_time: createDateTimeString(date, endTime),
  };
}

export default bookingService;
