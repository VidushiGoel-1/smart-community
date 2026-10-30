import api from '../axios/api';
import endpoints from '../axios/endpoints';

const ACCESS_TOKEN_KEY = 'sc_access_token';
const REFRESH_TOKEN_KEY = 'sc_refresh_token';
const USER_KEY = 'sc_auth_user';

const authService = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} data
   */
  register: async ({ name, email, password }) => {
    const response = await api.post(endpoints.REGISTER, { name, email, password });
    return response.data;
  },

  /**
   * Log in user
   * @param {{ email: string, password: string }} credentials
   */
  login: async ({ email, password }) => {
    const response = await api.post(endpoints.LOGIN, { email, password });
    const data = response.data;

    if (data?.accessToken) {
      authService.setTokens(data.accessToken, data.refreshToken);
      authService.setUser({ email });
    }

    return data;
  },

  /**
   * Verify email OTP
   * @param {{ email: string, otp: string }} payload
   */
  verifyOtp: async ({ email, otp }) => {
    const response = await api.post(endpoints.VERIFY_OTP, { email, otp });
    return response.data;
  },

  /**
   * Resend verification OTP
   * @param {{ email: string }} payload
   */
  resendOtp: async ({ email }) => {
    const response = await api.post(endpoints.RESEND_OTP, { email });
    return response.data;
  },

  /**
   * Log out user
   */
  logout: async () => {
    const refreshToken = authService.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post(endpoints.LOGOUT, { refreshToken });
      }
    } catch (err) {
      console.warn('Backend logout warning:', err);
    } finally {
      authService.clearSession();
    }
  },

  // Token & Session Storage Management
  setTokens: (accessToken, refreshToken) => {
    try {
      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error('Failed to store auth tokens:', e);
    }
  },

  getAccessToken: () => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getRefreshToken: () => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to store user profile:', e);
    }
  },

  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth session:', e);
    }
  },

  isAuthenticated: () => {
    try {
      return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
    } catch {
      return false;
    }
  },

  /**
   * Extract authenticated user ID from JWT access token payload
   */
  getCurrentUserId: () => {
    try {
      const token = authService.getAccessToken();
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      // Decode URL-safe base64 payload
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return parsed.sub || parsed.id || null;
    } catch {
      return null;
    }
  },
};

export default authService;