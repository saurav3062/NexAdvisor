import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'expert' | 'category';
  title: string;
  subtitle: string;
  image?: string;
  rating?: number;
  price?: number;
  category?: string;
}

async function searchExperts(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from('experts')
    .select(`
      id,
      title,
      hourly_rate,
      rating,
      users!inner(name, avatar),
      categories(name)
    `)
    .or(`title.ilike.%${query}%,bio.ilike.%${query}%`)
    .eq('status', 'active')
    .limit(10);

  if (error) throw error;

  return (data || []).map((e: any) => ({
    id: e.id,
    type: 'expert' as const,
    title: e.users?.name || 'Unknown',
    subtitle: e.title || 'Expert',
    image: e.users?.avatar_url,
    rating: e.rating,
    price: e.hourly_rate,
    category: e.categories?.name,
  }));
}

async function searchCategories(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      description,
      icon
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(5);

  if (error) throw error;

  return (data || []).map((c: any) => ({
    id: c.id,
    type: 'category' as const,
    title: c.name,
    subtitle: c.description || 'Browse category',
    category: c.name,
  }));
}

async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const [experts, categories] = await Promise.all([
    searchExperts(query),
    searchCategories(query),
  ]);

  // Interleave results, experts first
  const results: SearchResult[] = [];
  const maxLen = Math.max(experts.length, categories.length);
  for (let i = 0; i < maxLen; i++) {
    if (experts[i]) results.push(experts[i]);
    if (categories[i]) results.push(categories[i]);
  }

  return results;
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => globalSearch(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}
