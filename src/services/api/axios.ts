import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../../lib/store';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      console.error('No original request found:', error);
      return Promise.reject(error);
    }

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        originalRequest._retry = true;
        const { refreshToken, clearAuth } = useAuthStore.getState();
        
        if (!refreshToken) {
          clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        const { token } = response.data;
        
        useAuthStore.setState((state) => ({
          ...state,
          token
        }));
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle other errors
    console.error('API error:', {
      status: error.response.status,
      data: error.response.data,
      url: originalRequest.url,
      method: originalRequest.method,
    });

    return Promise.reject(error);
  }
);

// Add request/response timing
api.interceptors.request.use((config) => {
  config.metadata = { startTime: new Date() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      console.debug(`Request to ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    const endTime = new Date();
    const startTime = error.config?.metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      console.debug(`Failed request to ${error.config?.url} took ${duration}ms`);
    }
    return Promise.reject(error);
  }
);

export default api;