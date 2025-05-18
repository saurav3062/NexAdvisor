import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Users, Video, MapPin, DollarSign, Check, ArrowLeft, CreditCard } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Expert, TimeSlot } from '../../types';
import { useCreateBooking } from '../../hooks/useBookings';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  selectedSlot?: TimeSlot;
  selectedService?: ExpertService;
}

type BookingStep = 'service' | 'date' | 'details' | 'payment' | 'confirmation';

export function BookingModal({
  isOpen,
  onClose,
  expert,
  selectedSlot,
  selectedService
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [bookingDetails, setBookingDetails] = useState({
    participants: 1,
    notes: '',
    location: 'online',
  });
  const createBooking = useCreateBooking();

  const handlePayment = async () => {
    try {
      await createBooking.mutateAsync({
        expertId: expert.id,
        serviceId: selectedService?.id || '',
        startTime: selectedSlot?.startTime || '',
        endTime: selectedSlot?.endTime || '',
        ...bookingDetails
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
            <div className="space-y-4">
              {expert.services.map(service => (
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
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Booking Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Participants
              </label>
              <select
                value={bookingDetails.participants}
                onChange={(e) => setBookingDetails({
                  ...bookingDetails,
                  participants: parseInt(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {[...Array(selectedService?.maxParticipants || 1)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
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
                      location: e.target.value
                    })}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Online Meeting</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="in-person"
                    checked={bookingDetails.location === 'in-person'}
                    onChange={(e) => setBookingDetails({
                      ...bookingDetails,
                      location: e.target.value
                    })}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">In Person</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={bookingDetails.notes}
                onChange={(e) => setBookingDetails({
                  ...bookingDetails,
                  notes: e.target.value
                })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific requirements or questions..."
              />
            </div>

            <div className="flex justify-end space-x-4">
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
            <h3 className="text-lg font-semibold">Payment Details</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-4">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service</span>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span>{selectedService?.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time</span>
                  <span>{format(new Date(selectedSlot?.startTime || ''), 'PPp')}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span>${selectedService?.price}</span>
                </div>
              </div>
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

            <div className="flex justify-end space-x-4">
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
              Booking Confirmed!
            </h3>
            <p className="text-gray-600 mb-6">
              Your session has been successfully booked.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium">
                    {format(new Date(selectedSlot?.startTime || ''), 'PPp')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">
                    {selectedService?.duration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expert</span>
                  <span className="font-medium">{expert.name}</span>
                </div>
              </div>
            </div>
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