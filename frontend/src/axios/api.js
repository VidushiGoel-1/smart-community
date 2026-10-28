import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://smart-community-2.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout to handle Render cold starts
});

// Request Interceptor: Attach Bearer token if present in localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('sc_access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage access failed (e.g. private browsing restriction)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Provide clean, user-friendly error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      error.isNetworkOrCors = true;
      error.friendlyMessage = 'Network Error';
    } else if (error.response?.data?.message) {
      error.friendlyMessage = error.response.data.message;
    } else if (error.response?.status === 400) {
      error.friendlyMessage = 'Invalid request. Please verify your inputs.';
    } else if (error.response?.status === 401) {
      error.friendlyMessage = 'Authentication failed. Please check your credentials.';
    } else if (error.response?.status === 404) {
      error.friendlyMessage = 'The requested service endpoint was not found.';
    } else if (error.response?.status === 409) {
      error.friendlyMessage = 'A conflict occurred. This record may already exist.';
    } else if (error.response?.status >= 500) {
      error.friendlyMessage = 'The server encountered an error. Please try again shortly.';
    } else {
      error.friendlyMessage = error.message || 'An unexpected error occurred.';
    }
    return Promise.reject(error);
  }
);

export default api;