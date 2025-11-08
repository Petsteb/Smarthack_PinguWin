// Floor plan types
export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface FloorPlanRoom {
  id: string;
  name: string;
  type: string;
  polygon: Point[];
  bounds: Bounds;
}

export interface FloorPlanObject {
  id: string;
  name: string;
  type: string;
  polygon: Point[];
  bounds: Bounds;
  room?: string;
  roomName?: string;
}

export interface FloorPlanData {
  rooms: FloorPlanRoom[];
  objects: FloorPlanObject[];
}

// Mesh configuration types
export interface MeshConfig {
  file: string;
  scale: [number, number, number];
  rotation: [number, number, number];
  offset: [number, number, number];
  color: string;
  opacity?: number;
}

export interface MeshConfiguration {
  meshes: Record<string, MeshConfig>;
  settings: {
    autoRotation: boolean;
    enableShadows: boolean;
    ambientLightIntensity: number;
    directionalLightIntensity: number;
    backgroundColor: string;
    gridHelper: boolean;
    axisHelper: boolean;
  };
}

// User types
export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  total_points: number;
  level: number;
  tokens: number;
  preferences: Record<string, any>;
  created_at: string;
  last_login?: string;
}

// Resource types
export type ResourceType = 'room' | 'desk' | 'facility';
export type ResourceStatus = 'available' | 'occupied' | 'maintenance' | 'disabled';

export interface Room {
  id: string;
  external_id?: string;
  name: string;
  description?: string;
  type: ResourceType;
  status: ResourceStatus;
  floor_number: number;
  polygon_data?: Point[];
  bounds?: Bounds;
  capacity: number;
  amenities: string[];
  is_bookable: boolean;
  requires_approval: boolean;
  min_booking_duration: number;
  max_booking_duration: number;
  advance_booking_days: number;
  equipment: Record<string, any>;
  image_urls: string[];
  mesh_type?: string;
  created_at: string;
}

export interface Desk {
  id: string;
  external_id?: string;
  name: string;
  description?: string;
  room_id?: string;
  floor_number: number;
  polygon_data?: Point[];
  bounds?: Bounds;
  status: ResourceStatus;
  has_monitor: boolean;
  has_keyboard: boolean;
  has_mouse: boolean;
  is_standing_desk: boolean;
  equipment: Record<string, any>;
  is_bookable: boolean;
  requires_approval: boolean;
  image_urls: string[];
  mesh_type?: string;
  created_at: string;
}

export interface Facility {
  id: string;
  external_id?: string;
  name: string;
  description?: string;
  facility_type: string;
  floor_number: number;
  polygon_data?: Point[];
  bounds?: Bounds;
  status: ResourceStatus;
  is_bookable: boolean;
  requires_approval: boolean;
  max_booking_duration: number;
  features: Record<string, any>;
  image_urls: string[];
  mesh_type?: string;
  created_at: string;
}

// Booking types
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'rejected' | 'no_show';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface Booking {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  title?: string;
  description?: string;
  purpose?: string;
  attendee_count: number;
  attendee_emails: string[];
  requires_checkin: boolean;
  checked_in_at?: string;
  approved_by_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  recurring_booking_id?: string;
  google_calendar_event_id?: string;
  teams_meeting_url?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  metadata: Record<string, any>;
  created_at: string;
  duration_minutes: number;
  is_active: boolean;
}

// Notification types
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'booking_rejected'
  | 'booking_approval_needed'
  | 'check_in_reminder'
  | 'booking_ending_soon'
  | 'achievement_unlocked'
  | 'level_up'
  | 'resource_maintenance'
  | 'system_announcement';

export type NotificationStatus = 'pending' | 'sent' | 'read' | 'failed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  related_booking_id?: string;
  related_resource_id?: string;
  related_resource_type?: string;
  action_url?: string;
  action_text?: string;
  sent_via_email: boolean;
  sent_via_push: boolean;
  sent_via_websocket: boolean;
  read_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  sent_at?: string;
}

// Achievement types
export type AchievementType =
  | 'booking_milestone'
  | 'early_bird'
  | 'night_owl'
  | 'perfect_attendance'
  | 'social_butterfly'
  | 'space_explorer'
  | 'team_player'
  | 'efficiency_expert'
  | 'streak';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  category: string;
  required_value: number;
  points_reward: number;
  tokens_reward: number;
  icon_url?: string;
  badge_color?: string;
  is_active: boolean;
  is_hidden: boolean;
  criteria: Record<string, any>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  current_value: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Statistics types
export interface UserStatistics {
  id: string;
  user_id: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  no_show_count: number;
  total_hours_booked: number;
  total_rooms_used: number;
  total_desks_used: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_booking_date?: string;
  check_in_rate: number;
  on_time_rate: number;
  total_attendees_invited: number;
  average_meeting_size: number;
  favorite_room_id?: string;
  favorite_desk_id?: string;
  preferred_booking_time?: string;
  average_booking_duration: number;
  metrics: Record<string, any>;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
