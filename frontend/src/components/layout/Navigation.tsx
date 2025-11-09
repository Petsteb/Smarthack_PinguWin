import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, LogIn, UserPlus, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">SmartHack Booking</h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <>
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="font-medium">{user.full_name || user.email}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            Level {user.level} • {user.total_points} pts
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <User size={16} />
                          My Profile
                        </Link>

                        <Link
                          to="/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <User size={16} />
                          Dashboard
                        </Link>

                        <Link
                          to="/bookings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <User size={16} />
                          My Bookings
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                          >
                            <User size={16} />
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Not Authenticated */}
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
