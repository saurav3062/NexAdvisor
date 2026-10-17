import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from '../../types';
import { BookingCard } from './BookingCard';

interface UpcomingBookingsProps {
  bookings: Booking[];
}

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  const upcomingBookings = bookings.filter(
    booking => new Date(booking.date) > new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
        <Calendar className="h-5 w-5 text-gray-400" />
      </div>

      {upcomingBookings.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
      ) : (
        <div className="space-y-4">
          {upcomingBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <BookingCard
                booking={booking}
                onJoin={() => console.log('Join meeting:', booking.id)}
                onCancel={() => console.log('Cancel booking:', booking.id)}
                onReschedule={() => console.log('Reschedule booking:', booking.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}