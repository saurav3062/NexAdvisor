import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '../types';
import { bookingService } from '../services/supabaseApi';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export function useBookings(filters?: { status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let bookings;
      if (user.role === 'expert') {
        // Get expert profile ID first (user.id is the auth user ID, not expert.id)
        const { data: expert } = await supabase
          .from('experts')
          .select('id')
          .eq('user_id', user.id)
          .single();
        const expertId = expert?.id || user.id;
        const expertData = await bookingService.listByExpert(expertId, filters?.status);
        bookings = expertData;
      } else {
        bookings = await bookingService.listByClient(user.id, filters?.status);
      }

      return bookings.map((b: any) => ({
        id: b.id,
        expertId: b.expert_id,
        clientId: b.client_id,
        date: b.start_time?.split('T')[0] || '',
        time: b.start_time?.split('T')[1]?.slice(0, 5) || '',
        duration: b.duration || 60,
        status: b.status,
        amount: b.amount,
        createdAt: b.created_at,
        expert: b.expert ? {
          id: b.expert.id,
          name: b.expert.user?.name || '',
          image: b.expert.user?.avatar || '',
          expertise: b.expert.title || '',
          category: b.expert.category?.name || ''
        } : undefined,
        client: b.client ? {
          id: b.client.id,
          name: b.client.name || '',
          image: b.client.avatar || ''
        } : undefined,
        service: b.service ? {
          id: b.service.id,
          name: b.service.name || '',
          duration: b.service.duration || 60
        } : undefined
      })) as Booking[];
    },
    enabled: !!user
  });
}

export function useBooking(id?: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      if (!id) return null;
      const booking = await bookingService.get(id);
      return {
        id: booking.id,
        expertId: booking.expert_id,
        clientId: booking.client_id,
        client_id: booking.client_id,
        date: booking.start_time?.split('T')[0] || '',
        time: booking.start_time?.split('T')[1]?.slice(0, 5) || '',
        duration: booking.duration || 60,
        status: booking.status,
        amount: booking.amount,
        createdAt: booking.created_at,
        expert: booking.expert ? {
          id: booking.expert.id,
          user_id: booking.expert.user_id,
          users: booking.expert.user ? { name: booking.expert.user.name } : null,
          name: booking.expert.user?.name || '',
          image: booking.expert.user?.avatar || '',
          expertise: booking.expert.title || ''
        } : undefined
      };
    },
    enabled: !!id
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      expertId: string;
      serviceId?: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const booking = await bookingService.create({
        expertId: data.expertId,
        clientId: user.id,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create booking');
    }
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await bookingService.cancel(id, 'Cancelled by user', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    }
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await bookingService.confirm(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking confirmed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm booking');
    }
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, startTime, endTime }: { id: string; startTime: string; endTime: string }) => {
      return await bookingService.reschedule(id, startTime, endTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking rescheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reschedule booking');
    }
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; notes?: string }) => {
      return await bookingService.complete(data.bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking marked as complete');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete booking');
    }
  });
}
