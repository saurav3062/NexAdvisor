import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, Link as LinkIcon, Download } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booking' | 'break' | 'unavailable';
  client?: {
    name: string;
    avatar: string;
  };
  meetingUrl?: string;
  notes?: string;
}

interface CalendarIntegrationProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function CalendarIntegration({ events, onEventClick, onTimeSlotClick }: CalendarIntegrationProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      format(event.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const endHour = event.end.getHours();
    const duration = endHour - startHour;
    
    return {
      top: `${(startHour - 8) * 60}px`,
      height: `${duration * 60}px`,
    };
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-500';
      case 'break':
        return 'bg-yellow-500';
      case 'unavailable':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const exportToCalendar = () => {
    // Generate ICS file for calendar export
    const icsContent = events.map(event => {
      const start = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = event.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return [
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.notes || ''}`,
        `UID:${event.id}@nexadvisor.com`,
        'END:VEVENT'
      ].join('\n');
    }).join('\n');

    const icsFile = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NexAdvisor//Calendar//EN',
      icsContent,
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsFile], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexadvisor-calendar.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            ←
          </button>
          <span className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            →
          </button>
          <motion.button
            onClick={exportToCalendar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-4 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </motion.button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Time column header */}
          <div className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
            Time
          </div>
          
          {/* Day headers */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="bg-gray-50 p-3 text-center">
              <div className="text-sm font-medium text-gray-700">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {format(day, 'd')}
              </div>
            </div>
          ))}

          {/* Time slots */}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div className="bg-white p-3 text-center text-sm text-gray-600 border-r">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              
              {/* Day columns */}
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day).filter(event => 
                  event.start.getHours() <= hour && event.end.getHours() > hour
                );
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="bg-white p-1 min-h-[60px] relative cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onTimeSlotClick(day, hour)}
                  >
                    {dayEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        whileHover={{ scale: 1.02 }}
                        className={`absolute left-1 right-1 ${getEventColor(event.type)} text-white p-2 rounded text-xs cursor-pointer shadow-sm`}
                        style={getEventStyle(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.client && (
                          <div className="flex items-center mt-1">
                            <img
                              src={event.client.avatar}
                              alt={event.client.name}
                              className="w-4 h-4 rounded-full mr-1"
                            />
                            <span className="truncate">{event.client.name}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-gray-600">Bookings</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-gray-600">Breaks</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}