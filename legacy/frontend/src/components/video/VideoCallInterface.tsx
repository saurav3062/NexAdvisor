import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff, 
  Settings, Users, MessageSquare, Share, MoreVertical 
} from 'lucide-react';

interface VideoCallInterfaceProps {
  isHost: boolean;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    isMuted: boolean;
    isVideoOn: boolean;
  }>;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onToggleChat: () => void;
  onShareScreen: () => void;
  callDuration: number;
}

export function VideoCallInterface({
  isHost,
  participants,
  onToggleMic,
  onToggleVideo,
  onEndCall,
  onToggleChat,
  onShareScreen,
  callDuration
}: VideoCallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMic = () => {
    setIsMuted(!isMuted);
    onToggleMic();
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    onToggleVideo();
  };

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Main Video Area */}
      <div className="relative w-full h-full">
        {participants.length === 1 ? (
          // Single participant view
          <div className="w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
            />
            {!participants[0].isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <img
                    src={participants[0].avatar}
                    alt={participants[0].name}
                    className="w-32 h-32 rounded-full mx-auto mb-4"
                  />
                  <p className="text-white text-xl">{participants[0].name}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Multiple participants grid
          <div className={`grid gap-2 p-4 h-full ${
            participants.length <= 2 ? 'grid-cols-2' :
            participants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
            'grid-cols-3 grid-rows-2'
          }`}>
            {participants.map((participant) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={participant.id === 'current-user'}
                />
                {!participant.isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-16 h-16 rounded-full"
                    />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name}
                </div>
                {participant.isMuted && (
                  <div className="absolute top-2 right-2 bg-red-500 p-1 rounded-full">
                    <MicOff className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -50 }}
        className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
          <span className="text-sm">Recording • {formatDuration(callDuration)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{participants.length} participants</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 50 }}
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
            onClick={onShareScreen}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full"
          >
            <Share className="h-6 w-6 text-white" />
          </motion.button>

          <motion.button
            onClick={onToggleChat}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full"
          >
            <Users className="h-6 w-6 text-white" />
          </motion.button>

          <motion.button
            onClick={onEndCall}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-red-500 hover:bg-red-600 rounded-full"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full"
          >
            <MoreVertical className="h-6 w-6 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Participant List (when expanded) */}
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 0, x: 300 }}
        className="absolute top-0 right-0 w-80 h-full bg-black bg-opacity-80 text-white p-4"
      >
        <h3 className="text-lg font-semibold mb-4">Participants ({participants.length})</h3>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center space-x-3">
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <p className="font-medium">{participant.name}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  {participant.isMuted && <MicOff className="h-4 w-4" />}
                  {!participant.isVideoOn && <VideoOff className="h-4 w-4" />}
                </div>
              </div>
              {isHost && (
                <button className="text-gray-400 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}