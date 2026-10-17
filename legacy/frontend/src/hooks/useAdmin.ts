import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ExpertWithUser {
  id: string;
  user_id: string;
  title: string;
  hourly_rate: number;
  rating: number;
  verified: boolean;
  featured: boolean;
  status: string;
  created_at: string;
  users: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
  } | null;
}

async function getPendingExperts(): Promise<ExpertWithUser[]> {
  const { data, error } = await supabase
    .from('experts')
    .select(`
      id,
      user_id,
      title,
      hourly_rate,
      rating,
      verified,
      featured,
      status,
      created_at,
      users(name, email, avatar),
      categories(name)
    `)
    .eq('verified', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeExpert);
}

async function getAllExperts(page = 1, limit = 20): Promise<{ experts: ExpertWithUser[]; total: number }> {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('experts')
    .select(`
      id,
      user_id,
      title,
      hourly_rate,
      rating,
      verified,
      featured,
      status,
      created_at,
      users(name, email, avatar),
      categories(name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { experts: (data || []).map(normalizeExpert), total: count || 0 };
}

async function verifyExpert(expertId: string): Promise<void> {
  const { error } = await supabase
    .from('experts')
    .update({ verified: true })
    .eq('id', expertId);

  if (error) throw error;
}

async function rejectExpert(expertId: string): Promise<void> {
  const { error } = await supabase
    .from('experts')
    .update({ status: 'rejected' })
    .eq('id', expertId);

  if (error) throw error;
}

async function featureExpert(expertId: string, featured: boolean): Promise<void> {
  const { error } = await supabase
    .from('experts')
    .update({ featured })
    .eq('id', expertId);

  if (error) throw error;
}

export function usePendingExperts() {
  return useQuery({
    queryKey: ['pendingExperts'],
    queryFn: getPendingExperts,
    staleTime: 60 * 1000,
  });
}

export function useAllExperts(page = 1) {
  return useQuery({
    queryKey: ['allExperts', page],
    queryFn: () => getAllExperts(page),
    staleTime: 60 * 1000,
  });
}

export function useVerifyExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyExpert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingExperts'] });
      queryClient.invalidateQueries({ queryKey: ['allExperts'] });
    },
  });
}

export function useRejectExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectExpert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingExperts'] });
      queryClient.invalidateQueries({ queryKey: ['allExperts'] });
    },
  });
}

export function useFeatureExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expertId, featured }: { expertId: string; featured: boolean }) =>
      featureExpert(expertId, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingExperts'] });
      queryClient.invalidateQueries({ queryKey: ['allExperts'] });
    },
  });
}

function normalizeExpert(row: any): ExpertWithUser {
  const user = Array.isArray(row.users) ? row.users[0] : row.users;
  return { ...row, users: { name: user?.name || '', email: user?.email || '', avatar_url: user?.avatar || null }, categories: Array.isArray(row.categories) ? row.categories[0] || null : row.categories };
}
