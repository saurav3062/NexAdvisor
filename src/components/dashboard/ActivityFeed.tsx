import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  type: 'message' | 'review' | 'booking' | 'reminder';
  title: string;
  description: string;
  timestamp: string;
  icon: typeof MessageSquare;
  color: string;
}

export function ActivityFeed() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'booking',
      title: 'New Booking Confirmed',
      description: 'Session with Dr. Sarah Chen scheduled',
      timestamp: new Date().toISOString(),
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      type: 'review',
      title: 'New Review Received',
      description: '5-star rating from John Doe',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      icon: Star,
      color: 'bg-yellow-500'
    },
    {
      id: '3',
      type: 'reminder',
      title: 'Upcoming Session',
      description: 'Reminder: Session in 1 hour',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      id: '4',
      type: 'message',
      title: 'New Message',
      description: 'Message from Michael Roberts',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      icon: MessageSquare,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start space-x-4"
          >
            <div className={`${activity.color} p-2 rounded-lg`}>
              <activity.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-sm text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}