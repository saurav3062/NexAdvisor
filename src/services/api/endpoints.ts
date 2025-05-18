import { api } from './axios';
import { Expert, User, Booking, Review, Category } from '../../types';

// Mock user data for development
const MOCK_USER: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'client',
  createdAt: new Date().toISOString(),
};

const MOCK_TOKEN = 'mock-jwt-token';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token';

export const endpoints = {
  auth: {
    login: async (email: string, password: string) => {
      // For development, bypass actual API call and return mock data
      if (import.meta.env.DEV) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simple validation for demo account
        if (email === 'test@example.com' && password === 'password') {
          return {
            user: MOCK_USER,
            token: MOCK_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN
          };
        }
        
        throw new Error('Invalid credentials');
      }

      // In production, use actual API
      const response = await api.post<{ user: User; token: string; refreshToken: string }>(
        '/auth/login',
        { email, password }
      );
      return response.data;
    },

    register: async (data: {
      name: string;
      email: string;
      password: string;
      role: 'client' | 'expert';
    }) => {
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          user: {
            ...MOCK_USER,
            name: data.name,
            email: data.email,
            role: data.role,
          },
          token: MOCK_TOKEN
        };
      }

      const response = await api.post<{ user: User; token: string }>(
        '/auth/register',
        data
      );
      return response.data;
    },

    logout: async () => {
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      await api.post('/auth/logout');
    },

    refreshToken: async (refreshToken: string) => {
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { token: MOCK_TOKEN };
      }

      const response = await api.post<{ token: string }>(
        '/auth/refresh',
        { refreshToken }
      );
      return response.data;
    }
  },

  experts: {
    list: async (params?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: 'rating' | 'experience' | 'price';
      availability?: 'today' | 'this-week' | 'next-week';
      priceRange?: { min: number; max: number };
      languages?: string[];
      specializations?: string[];
    }) => {
      const response = await api.get<{ 
        experts: Expert[]; 
        total: number;
        currentPage: number;
        totalPages: number;
        hasMore: boolean;
      }>('/experts', { params });
      return response.data;
    },

    getFeatured: async () => {
      const response = await api.get<Expert[]>('/experts/featured');
      return response.data;
    },

    get: async (id: string) => {
      const response = await api.get<Expert>(`/experts/${id}`);
      return response.data;
    },

    getAvailability: async (expertId: string, date: string) => {
      const response = await api.get<{
        availableSlots: string[];
        timezone: string;
        duration: number;
      }>(`/experts/${expertId}/availability`, { params: { date } });
      return response.data;
    },

    getReviews: async (expertId: string, params?: {
      page?: number;
      limit?: number;
      sortBy?: 'date' | 'rating';
    }) => {
      const response = await api.get<{
        reviews: Review[];
        total: number;
        averageRating: number;
      }>(`/experts/${expertId}/reviews`, { params });
      return response.data;
    },

    getCategories: async () => {
      const response = await api.get<Category[]>('/experts/categories');
      return response.data;
    }
  },

  bookings: {
    create: async (data: {
      expertId: string;
      date: string;
      time: string;
      duration: number;
    }) => {
      const response = await api.post<Booking>('/bookings', data);
      return response.data;
    },

    list: async (params?: {
      status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
      page?: number;
      limit?: number;
    }) => {
      const response = await api.get<{
        bookings: Booking[];
        total: number;
        currentPage: number;
        totalPages: number;
      }>('/bookings', { params });
      return response.data;
    },

    get: async (id: string) => {
      const response = await api.get<Booking>(`/bookings/${id}`);
      return response.data;
    },

    cancel: async (id: string) => {
      await api.post(`/bookings/${id}/cancel`);
    },

    reschedule: async (id: string, data: { date: string; time: string }) => {
      const response = await api.post<Booking>(`/bookings/${id}/reschedule`, data);
      return response.data;
    }
  },

  categories: {
    list: async () => {
      const response = await api.get<Category[]>('/categories');
      return response.data;
    },

    get: async (id: string) => {
      const response = await api.get<Category>(`/categories/${id}`);
      return response.data;
    },

    getExperts: async (id: string, params?: {
      page?: number;
      limit?: number;
      sortBy?: 'rating' | 'experience' | 'price';
    }) => {
      const response = await api.get<{
        experts: Expert[];
        total: number;
        currentPage: number;
        totalPages: number;
      }>(`/categories/${id}/experts`, { params });
      return response.data;
    }
  },

  profile: {
    update: async (data: {
      name?: string;
      bio?: string;
      expertise?: string[];
      hourlyRate?: number;
      availability?: {
        days: string[];
        hours: { start: string; end: string; }[];
      };
    }) => {
      const response = await api.put<User>('/profile', data);
      return response.data;
    },

    updateAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.put<{ avatarUrl: string }>('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    getStats: async () => {
      const response = await api.get<{
        totalBookings: number;
        completedBookings: number;
        totalEarnings: number;
        averageRating: number;
      }>('/profile/stats');
      return response.data;
    }
  }
};