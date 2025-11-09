import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService, LoginCredentials, RegisterData } from '@/services/auth';

// ============================================================================
// Type Definitions
// ============================================================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// Create Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check authentication status and load user data
   */
  const checkAuth = async () => {
    try {
      const token = authService.getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get current user
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);

      // Call login API
      await authService.login(credentials);

      // Get user data
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    try {
      setLoading(true);

      // Register user
      await authService.register(data);

      // Auto-login after registration
      await login({
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  /**
   * Update user data (for profile updates)
   */
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// Custom Hook
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
