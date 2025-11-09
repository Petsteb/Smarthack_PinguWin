import { Link } from 'react-router-dom';
import { Calendar, Map, BarChart3, Settings } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Navigation />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
            Welcome to SmartHack Booking System
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book rooms, desks, and facilities with interactive 3D floor plans
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Link
            to="/floor-plan"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full p-4 mb-4">
                <Map size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3D Floor Plan</h3>
              <p className="text-gray-600">
                Explore office spaces in interactive 3D with custom meshes
              </p>
            </div>
          </Link>

          <Link
            to="/bookings"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <Calendar size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Bookings</h3>
              <p className="text-gray-600">
                View and manage your room and desk reservations
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 rounded-full p-4 mb-4">
                <BarChart3 size={32} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600">
                View statistics, achievements, and analytics
              </p>
            </div>
          </Link>

          <Link
            to="/admin"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-4 mb-4">
                <Settings size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Panel</h3>
              <p className="text-gray-600">
                Manage resources, users, and system settings
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">24</p>
              <p className="text-gray-600 mt-2">Available Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">156</p>
              <p className="text-gray-600 mt-2">Available Desks</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600">89%</p>
              <p className="text-gray-600 mt-2">Utilization Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-red-600">342</p>
              <p className="text-gray-600 mt-2">Active Bookings</p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-lg mb-2">🎮 Gamification</h4>
              <p className="text-gray-600">
                Earn points, unlock achievements, and compete on leaderboards
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-lg mb-2">🔔 Real-time Notifications</h4>
              <p className="text-gray-600">
                Get instant updates via WebSocket, email, and push notifications
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-lg mb-2">🔗 Integrations</h4>
              <p className="text-gray-600">
                Connect with Microsoft Teams, Google Calendar, and more
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-lg mb-2">📊 Analytics</h4>
              <p className="text-gray-600">
                Track usage patterns, utilization rates, and generate reports
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-lg mb-2">🔒 Role-based Access</h4>
              <p className="text-gray-600">
                Admin, Manager, and User roles with granular permissions
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-lg mb-2">📱 Mobile Friendly</h4>
              <p className="text-gray-600">
                Fully responsive design works on all devices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 SmartHack Booking System - Team PinguWin
          </p>
        </div>
      </footer>
    </div>
  );
}
