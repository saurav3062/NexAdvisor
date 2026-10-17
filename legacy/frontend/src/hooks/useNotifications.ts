import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/supabaseApi';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await notificationService.list(user.id);
    },
    enabled: !!user
  });

  const unreadCount = notifications.filter((n: any) => !n.read_at).length;

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast.success(payload.new.title);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      return await notificationService.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await notificationService.markAllAsRead(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate
  };
}

// Email notification helpers
export type EmailNotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'message_received'
  | 'review_requested';

interface SendEmailNotificationParams {
  type: EmailNotificationType;
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

async function sendEmailNotification(params: SendEmailNotificationParams): Promise<void> {
  const { error } = await supabase.functions.invoke('send-notification', {
    body: params,
  });

  if (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

export function useSendEmailNotification() {
  return useMutation({
    mutationFn: sendEmailNotification,
    onError: (error) => {
      console.error('Email notification failed:', error);
    },
  });
}

// Convenience functions for specific notification types
export const emailNotifications = {
  bookingCreated: (
    recipientEmail: string,
    recipientName: string,
    data: {
      clientName: string;
      expertName: string;
      serviceName?: string;
      date: string;
      time: string;
      duration: number;
      dashboardUrl: string;
    }
  ) => sendEmailNotification({
    type: 'booking_created',
    recipientEmail,
    recipientName,
    data,
  }),

  bookingConfirmed: (
    recipientEmail: string,
    recipientName: string,
    data: {
      expertName: string;
      serviceName?: string;
      date: string;
      time: string;
      duration: number;
      videoCallUrl: string;
    }
  ) => sendEmailNotification({
    type: 'booking_confirmed',
    recipientEmail,
    recipientName,
    data,
  }),

  bookingCancelled: (
    recipientEmail: string,
    recipientName: string,
    data: {
      expertName?: string;
      clientName?: string;
      date: string;
      time: string;
      reason?: string;
    }
  ) => sendEmailNotification({
    type: 'booking_cancelled',
    recipientEmail,
    recipientName,
    data,
  }),

  bookingReminder: (
    recipientEmail: string,
    recipientName: string,
    data: {
      expertName?: string;
      clientName?: string;
      date: string;
      time: string;
      timeUntil: string;
      videoCallUrl: string;
    }
  ) => sendEmailNotification({
    type: 'booking_reminder',
    recipientEmail,
    recipientName,
    data,
  }),

  messageReceived: (
    recipientEmail: string,
    recipientName: string,
    data: {
      senderName: string;
      messagePreview: string;
      conversationUrl: string;
    }
  ) => sendEmailNotification({
    type: 'message_received',
    recipientEmail,
    recipientName,
    data,
  }),

  reviewRequested: (
    recipientEmail: string,
    recipientName: string,
    data: {
      expertName: string;
      reviewUrl: string;
    }
  ) => sendEmailNotification({
    type: 'review_requested',
    recipientEmail,
    recipientName,
    data,
  }),
};
