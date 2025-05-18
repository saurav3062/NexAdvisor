import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { endpoints } from '../services/api/endpoints';
import { Booking, BookingFilters, PaginatedResponse } from '../types';
import { toast } from 'react-hot-toast';

export function useBookings(filters?: BookingFilters): UseQueryResult<PaginatedResponse<Booking>> {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => endpoints.bookings.list(filters),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => endpoints.bookings.get(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endpoints.bookings.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endpoints.bookings.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { date: string; time: string } }) =>
      endpoints.bookings.reschedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking rescheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reschedule booking');
    },
  });
}