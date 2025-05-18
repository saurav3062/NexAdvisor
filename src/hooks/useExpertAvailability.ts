import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { format } from 'date-fns';

export function useExpertAvailability(expertId: string, date?: string) {
  return useQuery({
    queryKey: ['expert-availability', expertId, date],
    queryFn: () => api.experts.getAvailability(expertId, date || format(new Date(), 'yyyy-MM-dd')),
    enabled: !!expertId && !!date,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      workingDays: string[];
      workingHours: { start: string; end: string };
      bufferTime: number;
      isOnline: boolean;
    }) => api.experts.updateAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability'] });
    },
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isOnline: boolean) => api.experts.toggleAvailability(isOnline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability'] });
    },
  });
}