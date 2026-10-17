import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Calendar, Clock, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { LoadingSpinner } from '../common/LoadingSpinner';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'new_booking':
    case 'booking_confirmed':
    case 'booking':
      return { icon: Calendar, color: 'bg-blue-500' };
    case 'review':
    case 'new_review':
      return { icon: Star, color: 'bg-yellow-500' };
    case 'reminder':
    case 'session_starting':
      return { icon: Clock, color: 'bg-purple-500' };
    case 'message':
    case 'new_message':
      return { icon: MessageSquare, color: 'bg-green-500' };
    case 'payment':
      return { icon: CheckCircle, color: 'bg-emerald-500' };
    case 'booking_cancelled':
      return { icon: XCircle, color: 'bg-red-500' };
    default:
      return { icon: Bell, color: 'bg-gray-500' };
  }
};

export function ActivityFeed() {
  const { notifications, isLoading, markAsRead } = useNotifications();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const activities = notifications?.slice(0, 8).map((n: any) => {
    const { icon: Icon, color } = getActivityIcon(n.type);
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.message,
      timestamp: n.created_at,
      read: !!n.read_at,
      icon: Icon,
      color,
      data: n.data
    };
  }) || [];

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p>No recent activity</p>
          <p className="text-sm mt-1">Your notifications will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <span className="text-xs text-gray-500">{activities.length} items</span>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => !activity.read && markAsRead(activity.id)}
            className={`flex items-start space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${
              !activity.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
            }`}
          >
            <div className={`${activity.color} p-2 rounded-lg flex-shrink-0`}>
              <activity.icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                {!activity.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {notifications && notifications.length > 8 && (
        <a
          href="/settings?tab=notifications"
          className="block text-center py-3 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium border-t"
        >
          View all notifications
        </a>
      )}
    </div>
  );
}
