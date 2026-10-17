import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, File, Image, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface ChatSystemProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'offline' | 'away';
  };
  messages: Message[];
  onSendMessage: (content: string, type: 'text' | 'image' | 'file', file?: File) => void;
  onStartCall: (type: 'audio' | 'video') => void;
}

export function ChatSystem({
  conversationId,
  currentUserId,
  otherUser,
  messages,
  onSendMessage,
  onStartCall
}: ChatSystemProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim(), 'text');
      setNewMessage('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      try {
        onSendMessage(file.name, 'file', file);
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.type === 'image' && message.fileUrl) {
      return (
        <div className="space-y-2">
          <img
            src={message.fileUrl}
            alt={message.fileName || 'Image'}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          {message.content && message.content !== message.fileName && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.type === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            message.senderId === currentUserId ? 'bg-blue-500' : 'bg-gray-200'
          }`}>
            <File className={`h-8 w-8 ${
              message.senderId === currentUserId ? 'text-white' : 'text-gray-600'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.fileName || 'File'}</p>
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs flex items-center gap-1 ${
                message.senderId === currentUserId ? 'text-blue-100' : 'text-blue-600'
              } hover:underline`}
            >
              <Download className="h-3 w-3" />
              Download
            </a>
          </div>
        </div>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              otherUser.status === 'online' ? 'bg-green-500' :
              otherUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{otherUser.status}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => onStartCall('audio')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <Phone className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={() => onStartCall('video')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <Video className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full"
          >
            <MoreVertical className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                message.senderId === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === currentUserId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {renderMessageContent(message)}
                <p className={`text-xs mt-1 ${
                  message.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {format(new Date(message.timestamp), 'HH:mm')}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {uploadingFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          </motion.div>
        )}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
            className="hidden"
          />
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50"
          >
            <Paperclip className="h-5 w-5" />
          </motion.button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={uploadingFile}
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
            disabled={!newMessage.trim() || uploadingFile}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}