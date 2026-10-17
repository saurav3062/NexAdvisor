import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/supabaseApi';
import { supabase } from '../lib/supabase';

export { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      if (user.role === 'expert') {
        const { data: expert } = await supabase
          .from('experts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('expert_id', expert?.id)
          .in('status', ['completed', 'confirmed']);

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('expert_id', expert?.id)
          .eq('status', 'completed');

        const totalEarnings = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        return {
          totalBookings: totalBookings || 0,
          totalEarnings,
          averageRating: expert?.rating || 0
        };
      } else {
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .in('status', ['completed', 'confirmed']);

        return {
          totalBookings: totalBookings || 0,
          totalEarnings: 0
        };
      }
    },
    enabled: !!user
  });
}

export function useUpdateProfile() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { website?: string; name?: string; avatar?: string; bio?: string; location?: string }) => {
      if (!user) throw new Error('Not authenticated');
      return updateProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      return userService.uploadAvatar(user.id, file);
    },
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Avatar uploaded successfully');
      return avatarUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload avatar');
    }
  });
}
