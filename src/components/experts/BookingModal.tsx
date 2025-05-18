import React, { useState, useEffect } from 'react';
import { format, addMonths, startOfMonth, eachDayOfInterval, endOfMonth, isSameMonth, isSameDay, addDays, isToday, isPast } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar, Check, Mail, Phone, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { Expert } from '../../types';
import { Modal } from '../common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpertAvailability } from '../../hooks/useExperts';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
}

type BookingStep = 'date' | 'time' | 'payment' | 'confirmation';

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, expert }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Fetch available time slots for selected date
  const { 
    data: availabilityData,
    isLoading: isLoadingSlots,
    error: availabilityError
  } = useExpertAvailability(
    expert.id, 
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  );

  const timeSlots = availabilityData?.availableSlots || [];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => {
    const prevDate = addMonths(currentDate, -1);
    if (!isPast(startOfMonth(prevDate))) {
      setCurrentDate(prevDate);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('payment');
  };

  const handlePayment = async () => {
    try {
      // Here you would integrate with your payment processing service
      // For demo purposes, we'll just simulate a successful payment
      const newBookingId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setBookingId(newBookingId);
      setCurrentStep('confirmation');
      toast.success('Payment processed successfully!');
    } catch (error) {
      toast.error('Payment processing failed. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setCurrentStep('date');
    setBookingId(null);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'date':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={prevMonth} 
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPast(startOfMonth(addMonths(currentDate, -1)))}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">{day}</div>
              ))}
              {days.map((day, dayIdx) => {
                const isDisabled = isPast(day) && !isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`
                      py-3 rounded-lg text-sm relative transition-colors
                      ${!isSameMonth(day, currentDate) ? 'text-gray-300' : 
                        isDisabled ? 'text-gray-300 cursor-not-allowed' :
                        isSameDay(day, selectedDate || new Date()) ? 'bg-blue-600 text-white' : 
                        'text-gray-900 hover:bg-blue-50'}
                      ${isToday(day) ? 'font-bold' : ''}
                    `}
                  >
                    {format(day, 'd')}
                    {isToday(day) && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Booking Information</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Sessions are {expert.sessionDuration || 60} minutes long</li>
                <li>• Cancellation is free up to 24 hours before</li>
                <li>• All times are in your local timezone</li>
              </ul>
            </div>
          </motion.div>
        );

      case 'time':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-[500px]"
          >
            <button 
              onClick={() => setCurrentStep('date')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to calendar
            </button>

            <h3 className="text-lg font-semibold mb-4">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : availabilityError ? (
              <div className="text-center text-red-600 py-8">
                Failed to load available time slots. Please try again.
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                No available time slots for this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm border hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Clock className="h-4 w-4" />
                    {time}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-[500px]"
          >
            <button 
              onClick={() => setCurrentStep('time')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to time selection
            </button>

            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Date</span>
                  </div>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Time</span>
                  </div>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Price</span>
                  </div>
                  <span className="font-medium">${expert.hourlyRate}/hour</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors mt-6"
            >
              Pay ${expert.hourlyRate}
            </button>
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[500px] flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div 
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Check className="h-10 w-10 text-green-600" />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Your booking has been confirmed!
            </h3>
            <p className="text-gray-600 mb-6">
              Booking ID: <span className="font-medium">{bookingId}</span>
            </p>

            <div className="bg-blue-50 rounded-xl p-6 w-full mb-6">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{expert.name}</h4>
                  <p className="text-gray-600">{expert.expertise}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Date</span>
                  </div>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Time</span>
                  </div>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <Mail className="h-4 w-4 inline mr-2" />
              Booking details have been sent to your email
            </div>
          </motion.div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === 'confirmation' ? 'Booking Confirmed!' :
        currentStep === 'payment' ? 'Complete Booking' :
        currentStep === 'time' ? 'Select Time' : 'Select Date'
      }
    >
      <div className="flex flex-col h-full">
        {currentStep !== 'confirmation' && (
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-6">
            <img
              src={expert.image}
              alt={expert.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{expert.name}</h3>
              <p className="text-gray-600">{expert.expertise}</p>
              <p className="text-blue-600 font-medium">${expert.hourlyRate}/hour</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </Modal>
  );
};