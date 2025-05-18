import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import adaptivePlugin from '@fullcalendar/adaptive';
import { format, parseISO, isWithinInterval, addMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Users, Video, MapPin, DollarSign } from 'lucide-react';
import type { TimeSlot, Expert, ExpertService } from '../../types';

interface BookingCalendarProps {
  expert: Expert;
  selectedService?: ExpertService;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  onServiceSelect?: (service: ExpertService) => void;
}

export function BookingCalendar({
  expert,
  selectedService,
  onTimeSlotSelect,
  onServiceSelect
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');

  // Calculate available time slots based on expert's availability
  const calculateAvailableSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const expertAvailability = expert.availability.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!expertAvailability || !expertAvailability.isAvailable) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const startTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${expertAvailability.startTime}`);
    const endTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${expertAvailability.endTime}`);
    
    let currentTime = startTime;
    const duration = selectedService?.duration || 60;

    while (isWithinInterval(addMinutes(currentTime, duration), { start: startTime, end: endTime })) {
      slots.push({
        id: `${format(currentTime, 'yyyy-MM-dd-HH-mm')}`,
        startTime: format(currentTime, "yyyy-MM-dd'T'HH:mm:ss"),
        endTime: format(addMinutes(currentTime, duration), "yyyy-MM-dd'T'HH:mm:ss"),
        duration,
        available: true,
        price: selectedService?.price || expert.services[0].price,
        currency: selectedService?.currency || expert.services[0].currency,
        bufferTimeStart: expertAvailability.bufferTime,
        bufferTimeEnd: expertAvailability.bufferTime
      });

      currentTime = addMinutes(currentTime, duration + expertAvailability.bufferTime);
    }

    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      setAvailableSlots(calculateAvailableSlots(selectedDate));
    }
  }, [selectedDate, selectedService]);

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    if (calendarView === 'dayGridMonth') {
      setCalendarView('timeGridWeek');
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    onTimeSlotSelect(slot);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Services Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Services</h3>
          <div className="space-y-3">
            {expert.services.map(service => (
              <motion.div
                key={service.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedService?.id === service.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => onServiceSelect?.(service)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <span className="text-blue-600 font-semibold">
                    ${service.price}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
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

        {/* Calendar */}
        <div className="lg:col-span-2">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
              adaptivePlugin
            ]}
            initialView={calendarView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            selectable={true}
            select={handleDateSelect}
            events={availableSlots.map(slot => ({
              id: slot.id,
              title: 'Available',
              start: slot.startTime,
              end: slot.endTime,
              backgroundColor: slot.available ? '#3b82f6' : '#9ca3af',
              borderColor: slot.available ? '#2563eb' : '#6b7280'
            }))}
            height="auto"
            expandRows={true}
            slotMinTime={expert.availability[0]?.startTime || '09:00:00'}
            slotMaxTime={expert.availability[0]?.endTime || '17:00:00'}
            allDaySlot={false}
            slotDuration="00:30:00"
            slotLabelInterval="01:00"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            viewDidMount={(view) => setCalendarView(view.view.type as any)}
          />
        </div>
      </div>

      {/* Time Slots */}
      <AnimatePresence>
        {selectedDate && availableSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Time Slots for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableSlots.map(slot => (
                <motion.button
                  key={slot.id}
                  onClick={() => handleTimeSlotSelect(slot)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedSlot?.id === slot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">
                      {format(parseISO(slot.startTime), 'HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {slot.duration} minutes
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Slot Summary */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 bg-blue-50 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Date</span>
                </div>
                <p className="font-medium">
                  {format(parseISO(selectedSlot.startTime), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Time</span>
                </div>
                <p className="font-medium">
                  {format(parseISO(selectedSlot.startTime), 'HH:mm')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Video className="h-4 w-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="font-medium">{selectedSlot.duration} minutes</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Price</span>
                </div>
                <p className="font-medium">
                  ${selectedSlot.price} {selectedSlot.currency}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}