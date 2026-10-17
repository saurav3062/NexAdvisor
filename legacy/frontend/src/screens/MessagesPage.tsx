'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Phone, Video, MoreVertical, Send, Paperclip, Smile } from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { useAuth } from '../contexts/AuthContext';
import { useConversations, useMessages, useSendMessage, useMarkMessagesAsRead } from '../hooks/useMessages';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '../lib/supabase';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  role: 'expert' | 'client';
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }
  return format(date, 'MMM d, HH:mm');
}

function formatLastMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  return format(date, 'MMM d');
}

export function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { messages, isLoading: messagesLoading } = useMessages(selectedConversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversationId && messages?.length && user) {
      markAsRead.mutate({ conversationId: selectedConversationId, userId: user.id });
    }
  }, [selectedConversationId, messages?.length, user, markAsRead]);

  useEffect(() => {
    const channel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            onlineUserIds.add(presence.user_id);
          });
        });
        setOnlineUsers(onlineUserIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please log in to view your messages.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredConversations = conversations?.filter((conv: any) =>
    conv.expert?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedConversation = conversations?.find((c: any) => c.id === selectedConversationId);

  const getParticipant = (conversation: any): Participant => {
    const isExpert = user.role === 'expert';
    const otherUser = isExpert ? conversation.client : conversation.expert?.user;
    const otherId = isExpert ? conversation.client_id : conversation.expert_id;

    return {
      id: otherId,
      name: otherUser?.name || 'Unknown',
      avatar: otherUser?.avatar || '',
      status: onlineUsers.has(otherId) ? 'online' : 'offline',
      role: isExpert ? 'client' : 'expert'
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    sendMessage.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim(),
      type: 'text'
    });
    setNewMessage('');
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    console.log('Starting call:', type);
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Communicate with your experts and clients</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversationId ? 'hidden md:flex' : ''}`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start by booking a session with an expert</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation: any) => {
                    const participant = getParticipant(conversation);
                    const isSelected = selectedConversationId === conversation.id;
                    const lastMessage = conversation.last_message;
                    const unreadCount = conversation.unread_count || 0;

                    return (
                      <motion.button
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`w-full p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors text-left ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            {participant.avatar ? (
                              <img
                                src={participant.avatar}
                                alt={participant.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-lg">
                                  {participant.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              participant.status === 'online' ? 'bg-green-500' :
                              participant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {participant.name}
                              </p>
                              {lastMessage?.created_at && (
                                <span className="text-xs text-gray-400">
                                  {formatLastMessageTime(lastMessage.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-500 truncate">
                                {lastMessage?.content || 'No messages yet'}
                              </p>
                              {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedConversationId ? 'hidden md:flex' : ''}`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedConversationId(null)}
                        className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {(() => {
                        const participant = getParticipant(selectedConversation);
                        return (
                          <>
                            <div className="relative">
                              {participant.avatar ? (
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium">
                                    {participant.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                participant.status === 'online' ? 'bg-green-500' :
                                participant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                              <p className="text-xs text-gray-500 capitalize">
                                {participant.status} • {participant.role}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => handleStartCall('audio')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Phone className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleStartCall('video')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Video className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="h-12 w-12 mb-3 text-gray-400" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation below</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {messages?.map((message: any) => {
                          const isCurrentUser = message.sender_id === user.id;
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isCurrentUser
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 text-right ${
                                  isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                                }`}>
                                  {formatMessageTime(message.created_at)}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                    <div className="flex items-center space-x-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Paperclip className="h-5 w-5" />
                      </motion.button>

                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-blue-600"
                        >
                          <Smile className="h-5 w-5" />
                        </motion.button>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
