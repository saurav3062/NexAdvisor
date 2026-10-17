import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Users, Video, MapPin, DollarSign, Check, ArrowLeft, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Expert, TimeSlot } from '../../types';
import { useCreateBooking } from '../../hooks/useBookings';
import { expertService } from '../../services/supabaseApi';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  preselectedSlot?: TimeSlot;
  preselectedService?: any;
}

type BookingStep = 'service' | 'date' | 'details' | 'payment' | 'confirmation';

export function BookingModal({
  isOpen,
  onClose,
  expert,
  preselectedSlot,
  preselectedService
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<any>(preselectedService || null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(preselectedSlot || null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    participants: 1,
    notes: '',
    location: 'online' as 'online' | 'in-person',
  });
  const createBooking = useCreateBooking();

  useEffect(() => {
    if (currentStep === 'date' && selectedDate) {
      loadAvailableSlots();
    }
  }, [currentStep, selectedDate]);

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const slots = await expertService.getAvailability(expert.id, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to load availability:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      await createBooking.mutateAsync({
        expertId: expert.id,
        serviceId: selectedService?.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: bookingDetails.notes
      });
      setCurrentStep('confirmation');
    } catch (error) {
      toast.error('Failed to create booking. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'service':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Select a Service</h3>
            {expert.services && expert.services.length > 0 ? (
              <div className="space-y-4">
                {expert.services.map((service: any) => (
                  <motion.div
                    key={service.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer ${
                      selectedService?.id === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedService(service);
                      setCurrentStep('date');
                    }}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium">{service.name}</h4>
                      <span className="text-blue-600 font-semibold">
                        ${service.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} min</span>
                      </div>
                      {service.maxParticipants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Up to {service.maxParticipants}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No services available from this expert yet.</p>
                <p className="text-sm text-gray-400 mt-2">Default consultation rate: ${expert.hourlyRate}/hour</p>
                <button
                  onClick={() => {
                    setSelectedService({
                      id: null,
                      name: 'General Consultation',
                      price: expert.hourlyRate,
                      duration: 60
                    });
                    setCurrentStep('date');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue with Default Rate
                </button>
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Select Date & Time</h3>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="font-medium">{format(selectedDate, 'EEEE')}</p>
                <p className="text-gray-500">{format(selectedDate, 'MMMM d, yyyy')}</p>
              </div>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Time Slots */}
            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <motion.button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg text-center ${
                      selectedSlot?.id === slot.id
                        ? 'bg-blue-600 text-white'
                        : slot.available
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={slot.available ? { scale: 1.02 } : {}}
                    whileTap={slot.available ? { scale: 0.98 } : {}}
                  >
                    <span className="font-medium">
                      {format(new Date(slot.startTime), 'h:mm a')}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No available slots for this date.</p>
                <p className="text-sm mt-2">Please try another day.</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep('service')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={() => selectedSlot && setCurrentStep('details')}
                disabled={!selectedSlot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Booking Details</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3">Session Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expert</span>
                  <span className="font-medium">{expert.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span>{selectedService?.name || 'Consultation'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span>{format(selectedDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span>{selectedSlot ? format(new Date(selectedSlot.startTime), 'h:mm a') : 'Select time'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span>{selectedService?.duration || 60} min</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location Preference
              </label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="online"
                    checked={bookingDetails.location === 'online'}
                    onChange={(e) => setBookingDetails({
                      ...bookingDetails,
                      location: e.target.value as 'online'
                    })}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 flex items-center gap-1">
                    <Video className="h-4 w-4" /> Online Meeting
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes (Optional)
              </label>
              <textarea
                value={bookingDetails.notes}
                onChange={(e) => setBookingDetails({
                  ...bookingDetails,
                  notes: e.target.value
                })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific requirements or questions for the expert..."
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep('date')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep('payment')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Complete Payment</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-4">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span>{selectedService?.name || 'Consultation'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span>{selectedService?.duration || 60} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span>
                    {selectedSlot ? format(new Date(selectedSlot.startTime), 'PPp') : 'Select time'}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span className="text-blue-600">${selectedService?.price || expert.hourlyRate}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Payment will be processed after the expert confirms your booking.
                You'll only be charged once the session is confirmed.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Card Number
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep('details')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={createBooking.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createBooking.isPending ? 'Processing...' : 'Complete Booking'}
              </button>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Request Sent!
            </h3>
            <p className="text-gray-600 mb-6">
              Your booking request has been sent to {expert.name}. You'll be notified once it's confirmed.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium">
                    {selectedSlot ? format(new Date(selectedSlot.startTime), 'PPp') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">
                    {selectedService?.duration || 60} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expert</span>
                  <span className="font-medium">{expert.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium text-blue-600">
                    ${selectedService?.price || expert.hourlyRate}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              A confirmation email has been sent to your email address.
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View My Bookings
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        currentStep === 'confirmation' ? 'Booking Confirmed' :
        currentStep === 'payment' ? 'Complete Payment' :
        currentStep === 'details' ? 'Booking Details' :
        currentStep === 'date' ? 'Select Date & Time' :
        'Book a Session'
      }
    >
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <div className="flex justify-between">
              {['service', 'date', 'details', 'payment'].map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center ${
                    index < ['service', 'date', 'details', 'payment'].indexOf(currentStep) + 1
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${index < ['service', 'date', 'details', 'payment'].indexOf(currentStep) + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`
                      w-full h-1 mx-2
                      ${index < ['service', 'date', 'details', 'payment'].indexOf(currentStep)
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}