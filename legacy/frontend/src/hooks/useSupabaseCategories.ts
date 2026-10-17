import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CategoryWithStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  expertCount: number;
  averagePrice: number;
  subcategories: string[];
}

export function useSupabaseCategories() {
  return useQuery({
    queryKey: ['supabase-categories'],
    queryFn: async (): Promise<CategoryWithStats[]> => {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      const categoriesWithStats = await Promise.all(
        (categories || []).map(async (category) => {
          const { count: expertCount } = await supabase
            .from('experts')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');

          const { data: priceData } = await supabase
            .from('experts')
            .select('hourly_rate')
            .eq('category_id', category.id)
            .eq('status', 'active');

          const averagePrice = priceData && priceData.length > 0
            ? priceData.reduce((sum, e) => sum + (e.hourly_rate || 0), 0) / priceData.length
            : 0;

          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            expertCount: expertCount || 0,
            averagePrice: Math.round(averagePrice),
            subcategories: []
          };
        })
      );

      return categoriesWithStats.sort((a, b) => b.expertCount - a.expertCount);
    },
    staleTime: 5 * 60 * 1000
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      const { count: expertCount } = await supabase
        .from('experts')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'active');

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        expertCount: expertCount || 0
      };
    },
    enabled: !!slug
  });
}
