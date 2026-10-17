'use client';

import React, { useState } from 'react';
import { useBookings, useCancelBooking, useConfirmBooking, useCompleteBooking } from '../hooks/useBookings';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, X, CheckCircle, Play, Video, MessageSquare, Star } from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function BookingsPage() {
  const { user } = useAuth();
  const { data: bookings, isLoading, error } = useBookings();
  const cancelBooking = useCancelBooking();
  const confirmBooking = useConfirmBooking();
  const completeBooking = useCompleteBooking();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking.mutateAsync(id);
    }
  };

  const handleConfirm = async (id: string) => {
    await confirmBooking.mutateAsync(id);
  };

  const handleComplete = async (id: string) => {
    await completeBooking.mutateAsync({ bookingId: id });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your bookings.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isExpert = user.role === 'expert';
  const filteredBookings = filter === 'all'
    ? bookings
    : bookings?.filter((b: any) => b.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
      <FadeIn>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isExpert ? 'Session Requests' : 'Your Bookings'}
            </h1>
            <p className="text-gray-600 mt-2">
              {filteredBookings?.length || 0} {filter === 'all' ? 'total' : filter} bookings
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!filteredBookings || filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You don't have any bookings yet."
                : `No ${filter} bookings.`}
            </p>
            {!isExpert && (
              <Link
                href="/experts"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Experts
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking: any, index: number) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {isExpert
                            ? `Session with ${booking.client?.name || 'Client'}`
                            : `Session with ${booking.expert?.name || 'Expert'}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.date), 'MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{booking.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{booking.duration} min</span>
                          </div>
                          {booking.amount && (
                            <div className="font-medium text-blue-600">
                              ${booking.amount}
                            </div>
                          )}
                        </div>
                        {booking.service && (
                          <p className="text-sm text-gray-500 mt-1">
                            Service: {booking.service.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>

                      {/* Expert Actions */}
                      {isExpert && booking.status === 'pending' && (
                        <>
                          <motion.button
                            onClick={() => handleConfirm(booking.id)}
                            disabled={confirmBooking.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirm
                          </motion.button>
                          <motion.button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancelBooking.isPending}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </motion.button>
                        </>
                      )}

                      {/* Client Actions */}
                      {!isExpert && booking.status === 'pending' && (
                        <motion.button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelBooking.isPending}
                          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </motion.button>
                      )}

                      {/* In Progress - Join Call */}
                      {booking.status === 'in_progress' && (
                        <motion.button
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Video className="h-4 w-4" />
                          Join Session
                        </motion.button>
                      )}

                      {/* Completed - Review */}
                      {booking.status === 'completed' && !isExpert && (
                        <motion.button
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Star className="h-4 w-4" />
                          Leave Review
                        </motion.button>
                      )}

                      {/* Expert: Mark Complete */}
                      {isExpert && booking.status === 'confirmed' && (
                        <motion.button
                          onClick={() => handleComplete(booking.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play className="h-4 w-4" />
                          Start Session
                        </motion.button>
                      )}

                      {/* Message */}
                      <Link
                        href={`/messages?booking=${booking.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    Booked on {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
