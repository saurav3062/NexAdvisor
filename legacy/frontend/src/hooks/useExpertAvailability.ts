import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { parseISO } from 'date-fns';
import { api as http } from '../services/api/axios';

export function useExpertAvailability(expertId: string, date?: string) {
  return useQuery({
    queryKey: ['expert-availability', expertId, date],
    queryFn: () => api.experts.getAvailability(expertId, date ? parseISO(date) : new Date()),
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
    }) => http.put('/experts/me/availability', data).then(response => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability'] });
    },
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isOnline: boolean) => http.patch('/experts/me/availability', { isOnline }).then(response => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability'] });
    },
  });
}