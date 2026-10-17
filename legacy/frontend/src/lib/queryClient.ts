import { QueryClient, QueryCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ApiError } from '../services/api';

function handleError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    toast.error(error.message);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error('An unexpected error occurred. Please try again.');
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 404) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 404) return false;
        return failureCount < 2;
      },
      onError: handleError,
    },
  },
});

// Add global cache reset on auth error
queryClient.getQueryCache().subscribe(({ type, query }) => {
  if (type === 'updated' && query.state.status === 'error' && query.state.error instanceof ApiError) {
    const error = query.state.error as ApiError;
    if (error.status === 401) {
      queryClient.clear();
      window.location.href = '/login';
    }
  }
});