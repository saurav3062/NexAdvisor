import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  expert: {
    id: string;
    name: string;
    image: string;
  };
  booking: {
    id: string;
    service: string;
    date: string;
  };
  paymentMethod: {
    type: string;
    last4: string;
    brand: string;
  };
}

export function usePayments(filters?: { status?: string; dateRange?: 'week' | 'month' | 'year' }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', user?.id, filters],
    queryFn: async (): Promise<Payment[]> => {
      if (!user) return [];

      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          status,
          created_at,
          payment_method,
          booking:bookings(
            id,
            start_time,
            service:expert_services(name),
            expert:experts(
              id,
              user:users!user_id(name, avatar)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateRange) {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency || 'USD',
        status: p.status,
        date: p.created_at,
        expert: {
          id: p.booking?.expert?.id || '',
          name: p.booking?.expert?.user?.name || 'Unknown',
          image: p.booking?.expert?.user?.avatar || ''
        },
        booking: {
          id: p.booking?.id || '',
          service: p.booking?.service?.name || 'Consultation',
          date: p.booking?.start_time || ''
        },
        paymentMethod: p.payment_method || {
          type: 'card',
          last4: '****',
          brand: 'Unknown'
        }
      }));
    },
    enabled: !!user
  });
}

export function useExpertEarnings(filters?: { dateRange?: 'week' | 'month' | 'year' }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expert-earnings', user?.id, filters],
    queryFn: async () => {
      if (!user) return { total: 0, pending: 0, payments: [] };

      const { data: expert } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!expert) return { total: 0, pending: 0, payments: [] };

      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          client:users!client_id(name, avatar)
        `)
        .eq('expert_id', expert.id)
        .order('created_at', { ascending: false });

      if (filters?.dateRange) {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: payments, error } = await query;

      if (error) throw error;

      const total = payments?.filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      const pending = payments?.filter((p: any) => p.status === 'pending')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

      return {
        total,
        pending,
        payments: payments || []
      };
    },
    enabled: !!user && user.role === 'expert'
  });
}

export function usePaymentMethods() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    },
    enabled: !!user
  });
}

export function useAddPaymentMethod() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethod: {
      type: string;
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
      isDefault?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (paymentMethod.isDefault) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          type: paymentMethod.type,
          last4: paymentMethod.last4,
          brand: paymentMethod.brand,
          expiry_month: paymentMethod.expiryMonth,
          expiry_year: paymentMethod.expiryYear,
          is_default: paymentMethod.isDefault || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add payment method');
    }
  });
}

export function useRemovePaymentMethod() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove payment method');
    }
  });
}
