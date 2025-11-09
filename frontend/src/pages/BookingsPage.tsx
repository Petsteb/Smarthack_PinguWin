import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, X, AlertCircle, CheckCircle, Loader2, Navigation } from 'lucide-react';
import { bookingService, Booking } from '../services/booking';
import { useAuth } from '../contexts/AuthContext';

type FilterType = 'all' | 'upcoming' | 'active' | 'past' | 'pending';

export default function BookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getMyBookings(1, 100, false);
      setBookings(response.bookings);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await bookingService.cancelBooking(bookingId);
      setSuccessMessage('Booking cancelled successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchBookings();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel booking');
      setTimeout(() => setError(null), 3000);
    } finally {
      setCancellingId(null);
    }
  };

  const handleNavigateToBooking = (booking: Booking) => {
    // Navigate to floor plan with navigation state
    navigate('/floor-plan', {
      state: {
        navigateToResource: {
          type: booking.resource_type,
          id: booking.resource_type === 'desk' ? booking.desk_id : booking.room_id,
          name: booking.resource_name,
        }
      }
    });
  };

  const filteredBookings = bookings.filter(booking => {
    switch (filter) {
      case 'upcoming':
        return booking.is_upcoming;
      case 'active':
        return booking.is_active;
      case 'past':
        return booking.is_past;
      case 'pending':
        return booking.pending;
      default:
        return true;
    }
  });

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.pending) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Approval
        </span>
      );
    }
    if (booking.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active Now
        </span>
      );
    }
    if (booking.is_upcoming) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Completed
      </span>
    );
  };

  const getResourceTypeColor = (type: string) => {
    return type === 'desk' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            </div>
            <Link
              to="/floor-plan"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Booking
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { key: 'upcoming', label: 'Upcoming', count: bookings.filter(b => b.is_upcoming).length },
              { key: 'active', label: 'Active', count: bookings.filter(b => b.is_active).length },
              { key: 'pending', label: 'Pending', count: bookings.filter(b => b.pending).length },
              { key: 'past', label: 'Past', count: bookings.filter(b => b.is_past).length },
              { key: 'all', label: 'All', count: bookings.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  filter === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Start by booking a desk or room from the floor plan.'
                : `You don't have any ${filter} bookings at the moment.`
              }
            </p>
            <Link
              to="/floor-plan"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Now
            </Link>
          </div>
        ) : (
          /* Bookings List */
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const start = formatDateTime(booking.start_time);
              const end = formatDateTime(booking.end_time);
              const canCancel = booking.is_upcoming && !booking.is_past;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left Side - Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getResourceTypeColor(booking.resource_type)}`}>
                            {booking.resource_type === 'desk' ? '🪑 Desk' : '🏢 Room'}
                          </span>
                          {getStatusBadge(booking)}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {booking.resource_name}
                        </h3>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{start.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{start.time} - {end.time}</span>
                            <span className="text-gray-400">({booking.duration_minutes} min)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs text-gray-500">
                              ID: {booking.resource_type === 'desk' ? booking.desk_id : booking.room_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-col gap-2">
                        {/* Navigate Button */}
                        <button
                          onClick={() => handleNavigateToBooking(booking)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          title="Navigate to this location in 3D view"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Navigate</span>
                        </button>

                        {/* Cancel Button */}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === booking.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Cancelling...</span>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
