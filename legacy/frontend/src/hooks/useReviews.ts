import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/supabaseApi';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useReviews(expertId?: string) {
  return useQuery({
    queryKey: ['reviews', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      return await reviewService.listByExpert(expertId);
    },
    enabled: !!expertId
  });
}

export function useUserReviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: async () => {
      if (!user) return { written: [], pending: [] };

      const { data: writtenReviews } = await supabase
        .from('reviews')
        .select(`
          *,
          expert:experts(
            id,
            user:users!user_id(name, avatar)
          ),
          booking:bookings(service_id, start_time)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      const { data: completedBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          expert:experts(
            id,
            user:users!user_id(name, avatar)
          ),
          service:expert_services(name)
        `)
        .eq('client_id', user.id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });

      const reviewedBookingIds = writtenReviews?.map((r: any) => r.booking_id) || [];
      const pendingReviews = completedBookings?.filter(
        (b: any) => !reviewedBookingIds.includes(b.id)
      ) || [];

      return {
        written: writtenReviews || [],
        pending: pendingReviews.map((b: any) => ({
          bookingId: b.id,
          expertId: b.expert?.id,
          expertName: b.expert?.user?.name,
          expertImage: b.expert?.user?.avatar,
          service: b.service?.name || 'Consultation',
          date: b.start_time
        }))
      };
    },
    enabled: !!user
  });
}

export function useCreateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      expertId,
      rating,
      comment
    }: {
      bookingId: string;
      expertId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      return await reviewService.create({
        bookingId,
        expertId,
        clientId: user.id,
        rating,
        comment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit review');
    }
  });
}

export function useAddReviewResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      return await reviewService.addExpertResponse(reviewId, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Response added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add response');
    }
  });
}
