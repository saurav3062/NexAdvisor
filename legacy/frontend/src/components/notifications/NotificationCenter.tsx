import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, MessageSquare, CreditCard, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'payment' | 'review';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onClearAll,
  onNotificationClick
}: NotificationCenterProps) {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return Calendar;
      case 'message':
        return MessageSquare;
      case 'payment':
        return CreditCard;
      case 'review':
        return Star;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return 'text-blue-500';
      case 'message':
        return 'text-green-500';
      case 'payment':
        return 'text-purple-500';
      case 'review':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-96">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear all
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${getIconColor(notification.type)} mt-1`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}