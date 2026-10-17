import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  onJoin?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}

export function BookingCard({ booking, onJoin, onCancel, onReschedule }: BookingCardProps) {
  const isUpcoming = new Date(booking.date) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {booking.expert?.image ? (
            <img
              src={booking.expert.image}
              alt={booking.expert.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.expert?.name || `Expert #${booking.expertId}`}
            </h3>
            <p className="text-gray-600">{booking.expert?.expertise}</p>
          </div>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'}
        `}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-5 w-5 mr-2" />
          <span>{format(new Date(booking.date), 'MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="h-5 w-5 mr-2" />
          <span>{booking.time} ({booking.duration} minutes)</span>
        </div>
      </div>

      {isUpcoming && (
        <div className="flex items-center space-x-3">
          {booking.status === 'confirmed' && onJoin && (
            <button
              onClick={onJoin}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Video className="h-5 w-5 mr-2" />
              Join Meeting
            </button>
          )}
          {booking.status === 'pending' && (
            <>
              {onReschedule && (
                <button
                  onClick={onReschedule}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reschedule
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}