import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../services/supabaseApi';
import { useAuth } from './useAuth';
import { useUploadMessageAttachment } from './useFileUpload';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await messageService.listConversations(user.id, user.role as 'client' | 'expert');
    },
    enabled: !!user
  });
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await messageService.listMessages(conversationId);
    },
    enabled: !!conversationId
  });

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          if (payload.new.sender_id !== user.id) {
            toast.success('New message received');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);

  return { messages, isLoading };
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uploadAttachment = useUploadMessageAttachment();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      type = 'text',
      file,
    }: {
      conversationId: string;
      content: string;
      type?: 'text' | 'image' | 'file';
      file?: File;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let fileUrl: string | undefined;
      let fileName: string | undefined;

      // Upload file if provided
      if (file) {
        const result = await uploadAttachment.mutateAsync(file);
        fileUrl = result.url;
        fileName = result.fileName;

        // Auto-detect type based on file
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else {
          type = 'file';
        }
      }

      return await messageService.sendMessage(conversationId, user.id, content, type, fileUrl, fileName);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      await messageService.markAsRead(conversationId, userId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useGetOrCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expertId, clientId }: { expertId: string; clientId?: string }) => {
      const clientIdToUse = clientId || user?.id;
      if (!clientIdToUse) throw new Error('Not authenticated');
      return await messageService.getOrCreateConversation(expertId, clientIdToUse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}
