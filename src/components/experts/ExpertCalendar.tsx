import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useExpertAvailability } from '../../hooks/useExperts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';

interface ExpertCalendarProps {
  expertId: string;
  onSlotSelect: (date: Date, time: string) => void;
}

export function ExpertCalendar({ expertId, onSlotSelect }: ExpertCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const { data: availability, isLoading } = useExpertAvailability(
    expertId,
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  );

  const handleDateSelect = (selectInfo: any) => {
    const date = selectInfo.start;
    setSelectedDate(date);
  };

  const events = React.useMemo(() => {
    if (!availability?.availableSlots) return [];
    
    return availability.availableSlots.map(time => ({
      title: 'Available',
      start: `${format(selectedDate!, 'yyyy-MM-dd')}T${time}`,
      end: `${format(selectedDate!, 'yyyy-MM-dd')}T${time}`,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      textColor: '#ffffff',
      display: 'block'
    }));
  }, [availability, selectedDate]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule a Session</h3>
        <p className="text-gray-600">Select a date and time for your consultation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            selectable={true}
            select={handleDateSelect}
            events={events}
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
          />
        </div>

        <div>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </span>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : availability?.availableSlots?.length ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Available time slots:</p>
                  {availability.availableSlots.map((time) => (
                    <motion.button
                      key={time}
                      onClick={() => onSlotSelect(selectedDate, time)}
                      className="flex items-center gap-2 w-full py-2 px-3 rounded-md bg-white hover:bg-blue-50 border border-gray-200 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{time}</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-4">
                  No available slots for this date
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}