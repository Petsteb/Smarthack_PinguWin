import api from './api';
import { User, ApiResponse } from '@/types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  new_password: string;
}

export interface UserUpdateData {
  username?: string;
  full_name?: string;
  bio?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

// ============================================================================
// Authentication Service
// ============================================================================

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login user and get tokens
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/auth/login', credentials);

    // Save tokens to localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }

    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });

    // Save new tokens
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }

    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: PasswordChangeData): Promise<void> {
    await api.post('/api/auth/change-password', data);
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: PasswordResetData): Promise<void> {
    await api.post('/api/auth/forgot-password', data);
  },

  /**
   * Confirm password reset
   */
  async resetPassword(data: PasswordResetConfirmData): Promise<void> {
    await api.post('/api/auth/reset-password', data);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },
};

// ============================================================================
// User Service
// ============================================================================

export const userService = {
  /**
   * Get current user profile
   */
  async getMyProfile(): Promise<User> {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateMyProfile(data: UserUpdateData): Promise<User> {
    const response = await api.put<User>('/api/users/me', data);
    return response.data;
  },

  /**
   * Get current user statistics
   */
  async getMyStats(): Promise<any> {
    const response = await api.get('/api/users/me/stats');
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const response = await api.get<User>(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Get user statistics by ID
   */
  async getUserStats(userId: string): Promise<any> {
    const response = await api.get(`/api/users/${userId}/stats`);
    return response.data;
  },

  /**
   * Get all users (admin/manager only)
   */
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    role?: string;
    is_active?: boolean;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/users/', { params });
    return response.data;
  },

  /**
   * Update user (admin only)
   */
  async updateUser(userId: string, data: any): Promise<User> {
    const response = await api.put<User>(`/api/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/api/users/${userId}`);
  },

  /**
   * Activate user (admin only)
   */
  async activateUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/api/users/${userId}/activate`);
    return response.data;
  },

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/api/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Verify user (admin only)
   */
  async verifyUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/api/users/${userId}/verify`);
    return response.data;
  },

  /**
   * Update user points (admin only)
   */
  async updateUserPoints(
    userId: string,
    pointsDelta: number
  ): Promise<User> {
    const response = await api.post<User>(`/api/users/${userId}/points`, null, {
      params: { points_delta: pointsDelta },
    });
    return response.data;
  },

  /**
   * Update user tokens (admin only)
   */
  async updateUserTokens(
    userId: string,
    tokensDelta: number
  ): Promise<User> {
    const response = await api.post<User>(`/api/users/${userId}/tokens`, null, {
      params: { tokens_delta: tokensDelta },
    });
    return response.data;
  },
};
