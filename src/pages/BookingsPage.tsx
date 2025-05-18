import React from 'react';
import { useBookings } from '../hooks/useBookings';
import { format } from 'date-fns';
import { Calendar, Clock, X } from 'lucide-react';

export function BookingsPage() {
  const { bookings, loading, cancelBooking } = useBookings();

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Bookings</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y">
          {bookings.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No bookings found
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Session with Expert #{booking.expertId}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.date), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Duration: {booking.duration} minutes
                  </div>
                  <div>
                    Booked on: {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}