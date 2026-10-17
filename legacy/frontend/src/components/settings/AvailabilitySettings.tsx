import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface WorkingHours {
  start: string;
  end: string;
}

interface AvailabilitySettingsProps {
  initialSettings?: {
    workingDays: string[];
    workingHours: WorkingHours;
    bufferTime: number;
    isOnline: boolean;
  };
  onSave: (settings: any) => void;
}

export function AvailabilitySettings({ initialSettings, onSave }: AvailabilitySettingsProps) {
  const [settings, setSettings] = useState({
    workingDays: initialSettings?.workingDays || [],
    workingHours: initialSettings?.workingHours || { start: '09:00', end: '17:00' },
    bufferTime: initialSettings?.bufferTime || 15,
    isOnline: initialSettings?.isOnline ?? true
  });

  const weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const bufferOptions = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Online/Offline Toggle */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Availability Status</h3>
            <p className="text-sm text-gray-500">Toggle your availability for bookings</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isOnline}
              onChange={(e) => setSettings({ ...settings, isOnline: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {settings.isOnline ? 'Online' : 'Offline'}
            </span>
          </label>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, start: e.target.value }
                })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, end: e.target.value }
                })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Working Days</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {weekdays.map((day) => (
            <label key={day} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.workingDays.includes(day)}
                onChange={(e) => {
                  const days = e.target.checked
                    ? [...settings.workingDays, day]
                    : settings.workingDays.filter(d => d !== day);
                  setSettings({ ...settings, workingDays: days });
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{day}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Buffer Time */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Buffer Time</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add buffer time between sessions for preparation
        </p>
        <select
          value={settings.bufferTime}
          onChange={(e) => setSettings({ ...settings, bufferTime: Number(e.target.value) })}
          className="block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {bufferOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Warning for Existing Bookings */}
      {initialSettings && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Changes to your availability will not affect existing bookings.
                New bookings will follow the updated schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Save Availability
        </motion.button>
      </div>
    </form>
  );
}