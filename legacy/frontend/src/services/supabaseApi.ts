import { supabase, STORAGE_BUCKETS } from '../lib/supabase';
import { Expert, Booking, Review, Category, TimeSlot, User } from '../types';
import { format, addMinutes, parseISO, isWithinInterval, setHours, setMinutes } from 'date-fns';

// ==================== USER SERVICES ====================

export const userService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    await this.updateProfile(userId, { avatar: publicUrl });

    return publicUrl;
  }
};

// ==================== EXPERT SERVICES ====================

export const expertService = {
  async list(params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sortBy?: 'rating' | 'price' | 'experience';
    ascending?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('experts')
      .select(`
        *,
        user:users!user_id(*),
        category:categories(*),
        skills:expert_skills(*),
        certifications:expert_certifications(*),
        education:expert_education(*),
        languages:expert_languages(*),
        services:expert_services(*)
      `)
      .eq('status', 'active');

    if (params?.category) {
      query = query.eq('category_id', params.category);
    }

    if (params?.minPrice !== undefined) {
      query = query.gte('hourly_rate', params.minPrice);
    }

    if (params?.maxPrice !== undefined) {
      query = query.lte('hourly_rate', params.maxPrice);
    }

    if (params?.rating !== undefined) {
      query = query.gte('rating', params.rating);
    }

    if (params?.sortBy) {
      query = query.order(params.sortBy, {
        ascending: params.ascending ?? false
      });
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by search query if provided
    let experts = data || [];
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      experts = experts.filter((e: any) =>
        e.user?.name?.toLowerCase().includes(searchLower) ||
        e.title?.toLowerCase().includes(searchLower) ||
        e.skills?.some((s: any) => s.name?.toLowerCase().includes(searchLower))
      );
    }

    // Transform to include expertise array
    return experts.map((e: any) => ({
      ...e,
      expertise: e.skills?.map((s: any) => s.name) || [],
      name: e.user?.name || '',
      email: e.user?.email || '',
      image: e.user?.avatar || ''
    }));
  },

  async get(expertId: string) {
    const { data, error } = await supabase
      .from('experts')
      .select(`
        *,
        user:users!user_id(*),
        category:categories(*),
        skills:expert_skills(*),
        certifications:expert_certifications(*),
        education:expert_education(*),
        languages:expert_languages(*),
        services:expert_services(*)
      `)
      .eq('id', expertId)
      .single();

    if (error) throw error;

    return {
      ...data,
      expertise: data.skills?.map((s: any) => s.name) || [],
      name: data.user?.name || '',
      email: data.user?.email || '',
      image: data.user?.avatar || ''
    };
  },

  async create(expertData: any) {
    const { data, error } = await supabase
      .from('experts')
      .insert(expertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(expertId: string, updates: any) {
    const { data, error } = await supabase
      .from('experts')
      .update(updates)
      .eq('id', expertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAvailability(expertId: string, date: Date): Promise<TimeSlot[]> {
    const dayOfWeek = date.getDay();

    // Get expert's availability for this day
    const { data: availability, error: availError } = await supabase
      .from('expert_availability')
      .select('*')
      .eq('expert_id', expertId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single();

    if (availError || !availability) return [];

    // Get existing bookings for this day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('expert_id', expertId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .in('status', ['pending', 'confirmed', 'in_progress']);

    if (bookingError) throw bookingError;

    // Generate available time slots
    const slots: TimeSlot[] = [];
    const slotsDate = format(date, 'yyyy-MM-dd');
    const [startHour, startMin] = availability.start_time.split(':').map(Number);
    const [endHour, endMin] = availability.end_time.split(':').map(Number);

    let currentSlot = setMinutes(setHours(date, startHour), startMin);
    const endTime = setMinutes(setHours(date, endHour), endMin);
    const slotDuration = 60; // Default to 60 minutes

    while (addMinutes(currentSlot, slotDuration) <= endTime) {
      const slotStart = new Date(currentSlot);
      const slotEnd = addMinutes(currentSlot, slotDuration);

      // Check if slot overlaps with any existing booking
      const isBooked = bookings?.some((booking: any) => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return (
          isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd }) ||
          isWithinInterval(slotEnd, { start: bookingStart, end: bookingEnd }) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      slots.push({
        id: `${slotsDate}-${format(slotStart, 'HH:mm')}`,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        duration: slotDuration,
        available: !isBooked,
        price: 0, // Will be set based on service selected
        currency: 'USD',
        bufferTimeStart: availability.buffer_time,
        bufferTimeEnd: availability.buffer_time
      });

      currentSlot = addMinutes(currentSlot, slotDuration + availability.buffer_time);
    }

    return slots;
  },

  async updateAvailability(expertId: string, availability: any[]) {
    // Delete existing availability
    await supabase
      .from('expert_availability')
      .delete()
      .eq('expert_id', expertId);

    // Insert new availability
    const { data, error } = await supabase
      .from('expert_availability')
      .insert(availability.map(a => ({
        expert_id: expertId,
        ...a
      })))
      .select();

    if (error) throw error;
    return data;
  },

  async addSkill(expertId: string, skill: any) {
    const { data, error } = await supabase
      .from('expert_skills')
      .insert({ expert_id: expertId, ...skill })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeSkill(skillId: string) {
    const { error } = await supabase
      .from('expert_skills')
      .delete()
      .eq('id', skillId);

    if (error) throw error;
  },

  async addCertification(expertId: string, certification: any) {
    const { data, error } = await supabase
      .from('expert_certifications')
      .insert({ expert_id: expertId, ...certification })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addEducation(expertId: string, education: any) {
    const { data, error } = await supabase
      .from('expert_education')
      .insert({ expert_id: expertId, ...education })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addLanguage(expertId: string, language: any) {
    const { data, error } = await supabase
      .from('expert_languages')
      .insert({ expert_id: expertId, ...language })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addService(expertId: string, service: any) {
    const { data, error } = await supabase
      .from('expert_services')
      .insert({ expert_id: expertId, ...service })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateService(serviceId: string, updates: any) {
    const { data, error } = await supabase
      .from('expert_services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteService(serviceId: string) {
    const { error } = await supabase
      .from('expert_services')
      .delete()
      .eq('id', serviceId);

    if (error) throw error;
  }
};

// ==================== BOOKING SERVICES ====================

export const bookingService = {
  async create(bookingData: {
    expertId: string;
    clientId: string;
    serviceId?: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    // Get expert to calculate amount
    const expert = await expertService.get(bookingData.expertId);
    const duration = (new Date(bookingData.endTime).getTime() - new Date(bookingData.startTime).getTime()) / 60000;
    const hourlyRate = expert.hourly_rate || 0;
    const amount = (duration / 60) * hourlyRate;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        expert_id: bookingData.expertId,
        client_id: bookingData.clientId,
        service_id: bookingData.serviceId,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        duration,
        amount,
        status: 'pending',
        payment_status: 'pending'
      })
      .select(`
        *,
        expert:experts(
          *,
          user:users!user_id(*)
        )
      `)
      .single();

    if (error) throw error;

    // Send notification to expert
    await notificationService.create({
      userId: expert.user_id,
      type: 'new_booking',
      title: 'New Booking Request',
      message: `You have a new booking request from ${data.client?.name || 'a client'}`,
      data: { bookingId: data.id }
    });

    return data;
  },

  async get(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        expert:experts(
          *,
          user:users!user_id(*),
          category:categories(*)
        ),
        client:users(*),
        service:expert_services(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  },

  async listByClient(clientId: string, status?: string) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        expert:experts(
          *,
          user:users!user_id(*),
          category:categories(*)
        )
      `)
      .eq('client_id', clientId)
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async listByExpert(expertId: string, status?: string) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        client:users(*),
        service:expert_services(*)
      `)
      .eq('expert_id', expertId)
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async confirm(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancel(bookingId: string, reason: string, cancelledBy: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async complete(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    // Update expert stats
    const booking = await this.get(bookingId);
    await supabase.rpc('increment_expert_consultations', { expert_id: booking.expert_id });

    return data;
  },

  async reschedule(bookingId: string, newStartTime: string, newEndTime: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        status: 'rescheduled'
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== REVIEW SERVICES ====================

export const reviewService = {
  async create(reviewData: {
    bookingId: string;
    expertId: string;
    clientId: string;
    rating: number;
    comment?: string;
  }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: reviewData.bookingId,
        expert_id: reviewData.expertId,
        client_id: reviewData.clientId,
        rating: reviewData.rating,
        comment: reviewData.comment
      })
      .select()
      .single();

    if (error) throw error;

    // Update expert rating
    await this.updateExpertRating(reviewData.expertId);

    return data;
  },

  async listByExpert(expertId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        client:users!client_id(name, avatar)
      `)
      .eq('expert_id', expertId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addExpertResponse(reviewId: string, response: string) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        expert_response: response,
        responded_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpertRating(expertId: string) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('expert_id', expertId);

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await supabase
        .from('experts')
        .update({
          rating: Math.round(avgRating * 100) / 100,
          total_reviews: reviews.length
        })
        .eq('id', expertId);
    }
  }
};

// ==================== CATEGORY SERVICES ====================

export const categoryService = {
  async list() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data;
  },

  async create(category: any) {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(categoryId: string, updates: any) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(categoryId: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  }
};

// ==================== NOTIFICATION SERVICES ====================

export const notificationService = {
  async create(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async list(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;
    return count || 0;
  }
};

// ==================== MESSAGE SERVICES ====================

export const messageService = {
  async getOrCreateConversation(expertId: string, clientId: string) {
    // Try to get existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('expert_id', expertId)
      .eq('client_id', clientId)
      .single();

    if (existing) return existing;

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        expert_id: expertId,
        client_id: clientId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listConversations(userId: string, role: 'client' | 'expert') {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        expert:experts(
          *,
          user:users!user_id(*)
        ),
        client:users(*),
        last_message:messages(content, created_at, sender_id)
      `);

    if (role === 'client') {
      query = query.eq('client_id', userId);
    } else {
      const { data: experts, error: expertError } = await supabase.from('experts').select('id').eq('user_id', userId);
      if (expertError) throw expertError;
      query = query.in('expert_id', (experts || []).map(expert => expert.id));
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async listMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
        file_url: fileUrl,
        file_name: fileName
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  async markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) throw error;
  }
};

// ==================== FAVORITE SERVICES ====================

export const favoriteService = {
  async add(userId: string, expertId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        expert_id: expertId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(userId: string, expertId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('expert_id', expertId);

    if (error) throw error;
  },

  async list(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        expert:experts(
          *,
          user:users!user_id(*),
          category:categories(*)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map((f: any) => f.expert) || [];
  },

  async isFavorite(userId: string, expertId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('expert_id', expertId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
};

// ==================== ADMIN SERVICES ====================

export const adminService = {
  async getStats() {
    const [
      { count: totalUsers },
      { count: totalExperts },
      { count: totalBookings },
      { count: activeBookings },
      { count: totalRevenue }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('experts').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
      supabase.from('payments').select('amount', { count: 'exact' }).eq('status', 'completed')
    ]);

    // Calculate total revenue
    let revenue = 0;
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    if (payments) {
      revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    return {
      totalUsers: totalUsers || 0,
      totalExperts: totalExperts || 0,
      totalBookings: totalBookings || 0,
      activeBookings: activeBookings || 0,
      totalRevenue: revenue
    };
  },

  async getBookingsByStatus() {
    const { data, error } = await supabase
      .from('bookings')
      .select('status');

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((b: any) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });

    return counts;
  },

  async getBookingsByCategory() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        expert:experts(
          category:categories(name)
        )
      `);

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((b: any) => {
      const categoryName = b.expert?.category?.name || 'Uncategorized';
      counts[categoryName] = (counts[categoryName] || 0) + 1;
    });

    return counts;
  },

  async listUsers(role?: string) {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async updateUserStatus(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async verifyExpert(expertId: string) {
    const { data, error } = await supabase
      .from('experts')
      .update({ verified: true })
      .eq('id', expertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async featureExpert(expertId: string, featured: boolean) {
    const { data, error } = await supabase
      .from('experts')
      .update({ featured })
      .eq('id', expertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default {
  user: userService,
  expert: expertService,
  booking: bookingService,
  review: reviewService,
  category: categoryService,
  notification: notificationService,
  message: messageService,
  favorite: favoriteService,
  admin: adminService
};
