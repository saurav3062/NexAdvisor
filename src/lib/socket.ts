import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';

let socket: Socket | null = null;

export const initializeSocket = () => {
  const token = useAuthStore.getState().token;
  
  if (!token) {
    console.warn('No token available for socket connection');
    return null;
  }

  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle authentication errors
    socket.on('connect_error', (error) => {
      if (error.message === 'Authentication failed') {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Socket event handlers
export const socketEvents = {
  // Booking events
  onBookingCreated: (callback: (booking: any) => void) => {
    const socket = getSocket();
    socket?.on('booking:created', callback);
    return () => socket?.off('booking:created', callback);
  },

  onBookingUpdated: (callback: (booking: any) => void) => {
    const socket = getSocket();
    socket?.on('booking:updated', callback);
    return () => socket?.off('booking:updated', callback);
  },

  onBookingCancelled: (callback: (bookingId: string) => void) => {
    const socket = getSocket();
    socket?.on('booking:cancelled', callback);
    return () => socket?.off('booking:cancelled', callback);
  },

  // Chat events
  onNewMessage: (callback: (message: any) => void) => {
    const socket = getSocket();
    socket?.on('chat:message', callback);
    return () => socket?.off('chat:message', callback);
  },

  onUserTyping: (callback: (data: { userId: string; typing: boolean }) => void) => {
    const socket = getSocket();
    socket?.on('chat:typing', callback);
    return () => socket?.off('chat:typing', callback);
  },

  // Notification events
  onNotification: (callback: (notification: any) => void) => {
    const socket = getSocket();
    socket?.on('notification:new', callback);
    return () => socket?.off('notification:new', callback);
  },

  // Expert availability events
  onExpertStatusChange: (callback: (data: { expertId: string; status: string }) => void) => {
    const socket = getSocket();
    socket?.on('expert:status', callback);
    return () => socket?.off('expert:status', callback);
  },

  // Video call events
  onCallRequest: (callback: (data: any) => void) => {
    const socket = getSocket();
    socket?.on('call:request', callback);
    return () => socket?.off('call:request', callback);
  },

  onCallAccepted: (callback: (data: any) => void) => {
    const socket = getSocket();
    socket?.on('call:accepted', callback);
    return () => socket?.off('call:accepted', callback);
  },

  onCallRejected: (callback: (data: any) => void) => {
    const socket = getSocket();
    socket?.on('call:rejected', callback);
    return () => socket?.off('call:rejected', callback);
  },

  onCallEnded: (callback: (data: any) => void) => {
    const socket = getSocket();
    socket?.on('call:ended', callback);
    return () => socket?.off('call:ended', callback);
  },
};

// Socket emitters
export const socketEmitters = {
  // Booking actions
  createBooking: (data: any) => {
    const socket = getSocket();
    socket?.emit('booking:create', data);
  },

  updateBooking: (data: any) => {
    const socket = getSocket();
    socket?.emit('booking:update', data);
  },

  cancelBooking: (bookingId: string) => {
    const socket = getSocket();
    socket?.emit('booking:cancel', { bookingId });
  },

  // Chat actions
  sendMessage: (data: any) => {
    const socket = getSocket();
    socket?.emit('chat:message', data);
  },

  startTyping: (conversationId: string) => {
    const socket = getSocket();
    socket?.emit('chat:typing', { conversationId, typing: true });
  },

  stopTyping: (conversationId: string) => {
    const socket = getSocket();
    socket?.emit('chat:typing', { conversationId, typing: false });
  },

  // Expert availability actions
  updateExpertStatus: (status: 'available' | 'busy' | 'offline') => {
    const socket = getSocket();
    socket?.emit('expert:status', { status });
  },

  // Video call actions
  initiateCall: (data: any) => {
    const socket = getSocket();
    socket?.emit('call:initiate', data);
  },

  acceptCall: (data: any) => {
    const socket = getSocket();
    socket?.emit('call:accept', data);
  },

  rejectCall: (data: any) => {
    const socket = getSocket();
    socket?.emit('call:reject', data);
  },

  endCall: (data: any) => {
    const socket = getSocket();
    socket?.emit('call:end', data);
  },
};