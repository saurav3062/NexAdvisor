import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expertService, reviewService, categoryService } from '../services/supabaseApi';
import { supabase } from '../lib/supabase';
import { Expert } from '../types';
import { toast } from 'react-hot-toast';

export function useExperts(params?: {
  category?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'rating' | 'price' | 'experience';
  ascending?: boolean;
  limit?: number;
  offset?: number;
  availability?: 'any' | 'today' | 'week';
}) {
  return useQuery({
    queryKey: ['experts', params],
    queryFn: async () => {
      const categoryIdToUse = params?.categoryId || params?.category;

      const queryParams: any = {
        category: categoryIdToUse,
        search: params?.search,
        minPrice: params?.minPrice,
        maxPrice: params?.maxPrice,
        rating: params?.rating,
        sortBy: params?.sortBy,
        ascending: params?.ascending,
        limit: params?.limit || 50,
        offset: params?.offset
      };

      const data = await expertService.list(queryParams);

      const experts: Expert[] = data.map((e: any) => ({
        id: e.id,
        name: e.name || e.user?.name || '',
        image: e.image || e.user?.avatar || 'https://images.unsplash.com/photo-1472098440-0dc6-4c6e-8f6a-6f0a5c8e6e6e?w=300&h=300&fit=crop',
        expertise: e.title || '',
        category: e.category?.name || 'General',
        categoryId: e.category_id,
        rating: e.rating || 0,
        reviews: e.total_reviews || 0,
        hourlyRate: e.hourly_rate || 0,
        location: e.location || e.user?.location || 'Remote',
        availability: e.status === 'active' ? 'Available' : 'Busy',
        totalConsultations: e.total_consultations || 0,
        yearsOfExperience: e.years_of_experience || 1,
        skills: e.skills?.map((s: any) => s.name) || e.expertise || [],
        certifications: e.certifications?.map((c: any) => c.name) || [],
        successRate: e.success_rate || 95,
        bio: e.bio || '',
        shortBio: e.short_bio || '',
        services: e.services?.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: s.price,
          currency: s.currency || 'USD'
        })) || [],
        languages: e.languages?.map((l: any) => l.language || l.name) || [],
        education: e.education?.map((ed: any) => ({
          institution: ed.institution,
          degree: ed.degree,
          field: ed.field
        })) || [],
        company: e.company || '',
        verified: e.verified || false,
        featured: e.featured || false
      }));

      const total = await (async () => {
        let countQuery = supabase
          .from('experts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (categoryIdToUse) {
          countQuery = countQuery.eq('category_id', categoryIdToUse);
        }
        const { count } = await countQuery;
        return count || experts.length;
      })();

      return { experts, total, hasMore: (params?.offset || 0) + experts.length < total };
    }
  });
}

export function useExpert(id: string) {
  return useQuery({
    queryKey: ['expert', id],
    queryFn: async () => {
      const data = await expertService.get(id);

      return {
        id: data.id,
        name: data.name || data.user?.name || '',
        image: data.image || data.user?.avatar || 'https://images.unsplash.com/photo-1472098440-0dc6-4c6e-8f6a-6f0a5c8e6e6e?w=300&h=300&fit=crop',
        email: data.user?.email || '',
        expertise: data.title || '',
        category: data.category?.name || 'General',
        categoryId: data.category_id,
        rating: data.rating || 0,
        reviews: data.total_reviews || 0,
        hourlyRate: data.hourly_rate || 0,
        location: data.location || data.user?.location || 'Remote',
        availability: data.status === 'active' ? 'Available' : 'Busy',
        totalConsultations: data.total_consultations || 0,
        yearsOfExperience: data.years_of_experience || 1,
        skills: data.skills?.map((s: any) => s.name) || [],
        certifications: data.certifications?.map((c: any) => c.name) || [],
        successRate: data.success_rate || 95,
        bio: data.bio || '',
        shortBio: data.short_bio || '',
        services: data.services?.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: s.price,
          currency: s.currency || 'USD'
        })) || [],
        languages: data.languages?.map((l: any) => l.language || l.name) || [],
        education: data.education?.map((ed: any) => ({
          institution: ed.institution,
          degree: ed.degree,
          field: ed.field,
          startDate: ed.start_date,
          endDate: ed.end_date,
          description: ed.description
        })) || [],
        company: data.company || '',
        verified: data.verified || false,
        featured: data.featured || false,
        sessionDuration: data.session_duration || 60,
        userId: data.user_id
      } as Expert & {
        email?: string;
        shortBio?: string;
        categoryId?: string;
        verified?: boolean;
        featured?: boolean;
        userId?: string;
        education: any[];
      };
    },
    enabled: !!id
  });
}

export function useExpertReviews(expertId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'rating';
}) {
  return useQuery({
    queryKey: ['expert-reviews', expertId, params],
    queryFn: async () => {
      const reviews = await reviewService.listByExpert(expertId);

      return {
        reviews: reviews.map((r: any) => ({
          id: r.id,
          expertId: r.expert_id,
          clientId: r.client_id,
          clientName: r.client?.name || 'Anonymous',
          clientImage: r.client?.avatar,
          rating: r.rating,
          comment: r.comment,
          date: r.created_at,
          expertResponse: r.expert_response,
          respondedAt: r.responded_at
        })),
        total: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0
      };
    },
    enabled: !!expertId
  });
}

export function useExpertAvailability(expertId: string, date?: Date) {
  return useQuery({
    queryKey: ['expert-availability', expertId, date?.toDateString()],
    queryFn: async () => {
      const slots = date ? await expertService.getAvailability(expertId, date) : [];
      return {
        availableSlots: slots.filter(s => s.available),
        timezone: 'UTC',
        duration: 60
      };
    },
    enabled: !!expertId && !!date
  });
}

export function useFeaturedExperts() {
  return useQuery({
    queryKey: ['featured-experts'],
    queryFn: async () => {
      const data = await expertService.list({ sortBy: 'rating', limit: 8 });

      return data.map((e: any) => ({
        id: e.id,
        name: e.name || e.user?.name || '',
        image: e.image || e.user?.avatar || 'https://images.unsplash.com/photo-1472098440-0dc6-4c6e-8f6a-6f0a5c8e6e6e?w=300&h=300&fit=crop',
        expertise: e.title || '',
        category: e.category?.name || 'General',
        rating: e.rating || 0,
        reviews: e.total_reviews || 0,
        hourlyRate: e.hourly_rate || 0,
        location: e.user?.location || 'Remote',
        availability: 'Available',
        totalConsultations: e.consultations_count || 0,
        yearsOfExperience: e.experience_years || 1,
        skills: e.expertise || [],
        bio: e.bio || ''
      })) as Expert[];
    }
  });
}

export function useExpertCategories() {
  return useQuery({
    queryKey: ['expert-categories'],
    queryFn: async () => {
      const categories = await categoryService.list();
      return categories.map((c: any) => ({ id: c.id, name: c.name }));
    }
  });
}

export function useUpdateExpertProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expertId, data }: { expertId: string; data: any }) => {
      return await expertService.update(expertId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expert', variables.expertId] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });
}

export function useAddExpertService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expertId, service }: { expertId: string; service: any }) => {
      return await expertService.addService(expertId, service);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expert', variables.expertId] });
      toast.success('Service added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add service');
    }
  });
}

export function useUpdateExpertService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, updates }: { serviceId: string; updates: any }) => {
      return await expertService.updateService(serviceId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert'] });
      toast.success('Service updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service');
    }
  });
}

export function useDeleteExpertService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      await expertService.deleteService(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert'] });
      toast.success('Service deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete service');
    }
  });
}
