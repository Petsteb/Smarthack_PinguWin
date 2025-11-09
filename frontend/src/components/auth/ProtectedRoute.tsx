import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

// ============================================================================
// Type Definitions
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requireVerified?: boolean;
}

// ============================================================================
// Protected Route Component
// ============================================================================

export const ProtectedRoute = ({
  children,
  requiredRole,
  requireVerified = false,
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is verified (if required)
  if (requireVerified && !user.is_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verification Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please verify your email address to access this page. Check your
            inbox for the verification link.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    // Check if user is admin (admins have access to everything)
    if (user.role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Required role:{' '}
              <span className="font-semibold capitalize">{requiredRole}</span>
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

// ============================================================================
// Role-Specific Route Components
// ============================================================================

interface RoleProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export const AdminRoute = ({ children, requireVerified }: RoleProtectedRouteProps) => {
  return (
    <ProtectedRoute requiredRole="admin" requireVerified={requireVerified}>
      {children}
    </ProtectedRoute>
  );
};

export const ManagerRoute = ({ children, requireVerified }: RoleProtectedRouteProps) => {
  return (
    <ProtectedRoute requiredRole="manager" requireVerified={requireVerified}>
      {children}
    </ProtectedRoute>
  );
};

export const UserRoute = ({ children, requireVerified }: RoleProtectedRouteProps) => {
  return (
    <ProtectedRoute requiredRole="user" requireVerified={requireVerified}>
      {children}
    </ProtectedRoute>
  );
};
