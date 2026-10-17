'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, PhoneOff, Mic, MicOff, Video, VideoOff, Share, Users, Settings, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking, useCompleteBooking } from '../hooks/useBookings';
import { WebRTCClient } from '../lib/webrtc';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDuration } from '../utils/date';

interface Participant {
  id: string;
  name: string;
  avatar: string | null;
  isMuted: boolean;
  isVideoOn: boolean;
}

export function VideoCallPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId);
  const completeBooking = useCompleteBooking();

  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [callStarted, setCallStarted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcClient = useRef<WebRTCClient | null>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isExpert = user?.role === 'expert';
  const remoteUserId = isExpert ? booking?.client_id : booking?.expert?.user_id;

  // Initialize WebRTC
  useEffect(() => {
    if (!bookingId || !user || !remoteUserId) return;

    const initWebRTC = async () => {
      try {
        webrtcClient.current = new WebRTCClient(bookingId, user.id);

        const localStream = await webrtcClient.current.initialize();

        // Attach local stream to video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Set up callbacks
        webrtcClient.current.setOnRemoteStream((stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        });

        webrtcClient.current.setOnConnectionStateChange(setConnectionState);

        webrtcClient.current.setOnCallEnded(() => {
          toast.error('Call ended unexpectedly');
          handleEndCall();
        });

        // Expert initiates the call
        if (isExpert) {
          await webrtcClient.current.startCall(remoteUserId);
        }

        setCallStarted(true);
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        toast.error('Failed to access camera/microphone. Please check permissions.');
      }
    };

    initWebRTC();

    return () => {
      webrtcClient.current?.endCall();
    };
  }, [bookingId, user, remoteUserId, isExpert]);

  // Call duration timer
  useEffect(() => {
    if (callStarted && connectionState === 'connected') {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStarted, connectionState]);

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    if (showControls) {
      hideControls();
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleToggleMic = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webrtcClient.current?.toggleAudio(!newMutedState);
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    webrtcClient.current?.toggleVideo(newVideoState);
  };

  const handleShareScreen = async () => {
    if (isScreenSharing) {
      webrtcClient.current?.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const screenStream = await webrtcClient.current?.startScreenShare();
      if (screenStream && screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      }
    }
  };

  const handleEndCall = useCallback(async () => {
    webrtcClient.current?.endCall();

    // Mark booking as completed if it was in progress
    if (booking && booking.status === 'confirmed') {
      try {
        await completeBooking.mutateAsync({
          bookingId: booking.id,
          notes: 'Video consultation completed',
        });
        toast.success('Session completed');
      } catch (error) {
        console.error('Failed to complete booking:', error);
      }
    }

    router.push('/bookings');
  }, [booking, completeBooking, router]);

  if (bookingLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
          <button
            onClick={() => router.push('/bookings')}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Main Video Area */}
      <div className="relative w-full h-full">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Connection Status Overlay */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">
                {connectionState === 'new' && 'Initializing...'}
                {connectionState === 'connecting' && 'Connecting...'}
                {connectionState === 'disconnected' && 'Disconnected'}
                {connectionState === 'failed' && 'Connection failed'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Screen Share Preview */}
        {isScreenSharing && (
          <div className="absolute top-4 left-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-blue-500">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-gray-800"
            />
          </div>
        )}
      </div>

      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {connectionState === 'connected' ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <span className="text-sm bg-gray-800 px-3 py-1 rounded-full">
                {formatDuration(callDuration)}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-300">
                {booking.expert?.users?.name || 'Expert'} & {user?.name}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-6"
          >
            <div className="flex items-center justify-center space-x-4">
              <motion.button
                onClick={handleToggleMic}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-4 rounded-full ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6 text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </motion.button>

              <motion.button
                onClick={handleToggleVideo}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-4 rounded-full ${
                  !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isVideoOn ? (
                  <Video className="h-6 w-6 text-white" />
                ) : (
                  <VideoOff className="h-6 w-6 text-white" />
                )}
              </motion.button>

              <motion.button
                onClick={handleShareScreen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-4 rounded-full ${
                  isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                <Share className="h-6 w-6 text-white" />
              </motion.button>

              <motion.button
                onClick={() => setShowChat(!showChat)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-4 rounded-full ${
                  showChat ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </motion.button>

              <motion.button
                onClick={handleEndCall}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full"
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 w-96 h-full bg-white shadow-lg z-50"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 text-center text-gray-500">
              <p>Chat functionality available</p>
              <p className="text-sm mt-2">Messages sync with main conversation</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
