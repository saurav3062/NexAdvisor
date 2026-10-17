import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface MonthlyData {
  label: string;
  bookings: number;
  earnings: number;
}

interface CategoryData {
  category: string;
  count: number;
}

export function useExpertStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expertStats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Get expert profile
      const { data: expert, error: expertError } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (expertError || !expert) throw new Error('Expert not found');

      const expertId = expert.id;
      const sixMonthsAgo = subMonths(new Date(), 6);

      // Get monthly bookings and earnings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('amount, created_at')
        .eq('expert_id', expertId)
        .eq('status', 'completed')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Aggregate by month
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthLabel = format(monthStart, 'MMM');

        const monthBookings = (bookings || []).filter(b => {
          const date = new Date(b.created_at);
          return date >= monthStart && date <= monthEnd;
        });

        monthlyData.push({
          label: monthLabel,
          bookings: monthBookings.length,
          earnings: monthBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
        });
      }

      // Get category distribution
      const { data: expertData } = await supabase
        .from('experts')
        .select('category_id, categories(name)')
        .eq('id', expertId)
        .single();

      // Get total clients served
      const { count: totalClients } = await supabase
        .from('bookings')
        .select('client_id', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .eq('status', 'completed');

      // Get response rate (messages answered within 24h)
      const { data: messages } = await supabase
        .from('messages')
        .select('id, created_at, sender_id')
        .eq('conversation_id', expertId) // This needs proper conversation query
        .order('created_at', { ascending: false })
        .limit(100);

      return {
        monthlyData,
        categoryName: (expertData as any)?.categories?.name || 'General',
        totalClients: totalClients || 0,
      };
    },
    enabled: !!user && user.role === 'expert',
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clientStats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const sixMonthsAgo = subMonths(new Date(), 6);

      // Get monthly spending
      const { data: bookings } = await supabase
        .from('bookings')
        .select('amount, created_at, category_id, categories(name)')
        .eq('client_id', user.id)
        .in('status', ['completed', 'confirmed'])
        .gte('created_at', sixMonthsAgo.toISOString());

      // Aggregate by month
      const monthlyData: { label: string; spending: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthLabel = format(monthStart, 'MMM');

        const monthBookings = (bookings || []).filter(b => {
          const date = new Date(b.created_at);
          return date >= monthStart && date <= monthEnd;
        });

        monthlyData.push({
          label: monthLabel,
          spending: monthBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
        });
      }

      // Get category distribution
      const categoryMap = new Map<string, number>();
      (bookings || []).forEach(b => {
        const name = (b as any).categories?.name || 'Other';
        categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
      });

      const categoryData = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get unique experts consulted
      const { data: expertBookings } = await supabase
        .from('bookings')
        .select('expert_id')
        .eq('client_id', user.id)
        .eq('status', 'completed');

      const uniqueExperts = new Set((expertBookings || []).map(b => b.expert_id)).size;

      return {
        monthlyData,
        categoryData,
        uniqueExperts,
        totalSpent: (bookings || []).reduce((sum, b) => sum + (b.amount || 0), 0),
      };
    },
    enabled: !!user && user.role === 'client',
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboardSummary', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const isExpert = user.role === 'expert';

      if (isExpert) {
        // Get expert ID
        const { data: expert } = await supabase
          .from('experts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!expert) return null;

        // Get stats
        const { count: totalSessions } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('expert_id', expert.id)
          .eq('status', 'completed');

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('expert_id', expert.id)
          .eq('status', 'completed');

        const totalEarnings = (payments || []).reduce((sum, p) => sum + p.amount, 0);

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('expert_id', expert.id);

        const avgRating = reviews?.length
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        // Response rate - check if expert has replied to messages
        const { data: expertConversations } = await supabase
          .from('conversations')
          .select('id')
          .eq('expert_id', expert.id);

        const convIds = (expertConversations || []).map(c => c.id);
        let responseRate = 95;
        if (convIds.length > 0) {
          const { data: messages } = await supabase
            .from('messages')
            .select('id, sender_id, conversation_id, created_at')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: true });
          
          // Count conversations where expert has responded after client
          let respondedCount = 0;
          const convMap = new Map<string, { lastClient: string | null; expertReplied: boolean }>();
          (messages || []).forEach(m => {
            const entry = convMap.get(m.conversation_id) || { lastClient: null, expertReplied: false };
            if (m.sender_id !== user.id) {
              entry.lastClient = m.created_at;
            } else if (entry.lastClient) {
              entry.expertReplied = true;
            }
            convMap.set(m.conversation_id, entry);
          });
          let totalWithClientMsg = 0;
          convMap.forEach(v => {
            if (v.lastClient) totalWithClientMsg++;
            if (v.expertReplied) respondedCount++;
          });
          responseRate = totalWithClientMsg > 0 ? Math.round((respondedCount / totalWithClientMsg) * 100) : 95;
        }

        return {
          totalSessions: totalSessions || 0,
          totalEarnings,
          avgRating,
          responseRate,
        };
      } else {
        // Client stats
        const { count: totalConsultations } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('status', 'completed');

        const { count: activeBookings } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .in('status', ['confirmed', 'pending']);

        const { data: bookings } = await supabase
          .from('bookings')
          .select('expert_id')
          .eq('client_id', user.id)
          .eq('status', 'completed');

        const uniqueExperts = new Set((bookings || []).map(b => b.expert_id)).size;

        // Get total experts on platform for network count
        const { count: totalExperts } = await supabase
          .from('experts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active');

        return {
          totalConsultations: totalConsultations || 0,
          activeBookings: activeBookings || 0,
          uniqueExperts,
          expertNetwork: totalExperts || 0,
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
