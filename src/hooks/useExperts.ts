import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../services/api/endpoints';
import { ExpertFilters, Expert, PaginatedResponse } from '../types';
import { toast } from 'react-hot-toast';

export function useExperts(filters?: ExpertFilters) {
  return useInfiniteQuery({
    queryKey: ['experts', filters],
    queryFn: ({ pageParam = 1 }) => 
      endpoints.experts.list({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    keepPreviousData: true,
  });
}

export function useExpert(id: string) {
  return useQuery({
    queryKey: ['expert', id],
    queryFn: () => endpoints.experts.get(id),
    enabled: !!id,
  });
}

export function useExpertReviews(expertId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'rating';
}) {
  return useQuery({
    queryKey: ['expert-reviews', expertId, params],
    queryFn: () => endpoints.experts.getReviews(expertId, params),
    enabled: !!expertId,
  });
}

export function useExpertAvailability(expertId: string, date: string) {
  return useQuery({
    queryKey: ['expert-availability', expertId, date],
    queryFn: () => endpoints.experts.getAvailability(expertId, date),
    enabled: !!expertId && !!date,
  });
}

export function useFeaturedExperts() {
  return useQuery({
    queryKey: ['featured-experts'],
    queryFn: endpoints.experts.getFeatured,
  });
}

export function useExpertCategories() {
  return useQuery({
    queryKey: ['expert-categories'],
    queryFn: endpoints.experts.getCategories,
  });
}

export function useExpertsByCategory(categoryId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'experience' | 'price';
}) {
  return useQuery({
    queryKey: ['category-experts', categoryId, params],
    queryFn: () => endpoints.categories.getExperts(categoryId, params),
    enabled: !!categoryId,
  });
}

export function useUpdateExpertProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endpoints.profile.update,
    onSuccess: (data) => {
      queryClient.setQueryData(['expert-profile'], data);
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

export function useUpdateExpertAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endpoints.profile.updateAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['expert-profile'], (old: Expert | undefined) => ({
        ...old,
        avatar: data.avatarUrl,
      }));
      toast.success('Profile picture updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile picture');
    },
  });
}

export function useExpertStats() {
  return useQuery({
    queryKey: ['expert-stats'],
    queryFn: endpoints.profile.getStats,
  });
}