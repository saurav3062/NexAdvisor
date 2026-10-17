'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateProfile, useUploadAvatar } from '../hooks/useAuth';
import { User, Mail, Lock, Building2, MapPin, Globe, Clock, Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from '../components/animations/FadeIn';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface NotificationPreferences {
  bookingConfirmations: boolean;
  reminders: boolean;
  marketingUpdates: boolean;
  newMessages: boolean;
  sessionStart: boolean;
}

interface AvailabilitySettings {
  days: string[];
  hoursStart: string;
  hoursEnd: string;
  sessionDuration: number;
  bufferTime: number;
}

export function SettingsPage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'availability'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    location: '',
    website: '',
    bio: '',
    hourlyRate: ''
  });
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    bookingConfirmations: true,
    reminders: true,
    marketingUpdates: false,
    newMessages: true,
    sessionStart: true
  });
  const [availability, setAvailability] = useState<AvailabilitySettings>({
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hoursStart: '09:00',
    hoursEnd: '17:00',
    sessionDuration: 60,
    bufferTime: 10
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: '',
        location: user.location || '',
        website: user.website || '',
        bio: user.bio || '',
        hourlyRate: ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs) {
        setNotifications({
          bookingConfirmations: prefs.booking_confirmations ?? true,
          reminders: prefs.reminders ?? true,
          marketingUpdates: prefs.marketing_updates ?? false,
          newMessages: prefs.new_messages ?? true,
          sessionStart: prefs.session_start ?? true
        });
      }

      if (user.role === 'expert') {
        const { data: expert } = await supabase
          .from('experts')
          .select('hourly_rate')
          .eq('user_id', user.id)
          .single();

        if (expert) {
          setFormData(prev => ({
            ...prev,
            hourlyRate: String(expert.hourly_rate || '')
          }));
        }

        const { data: availData } = await supabase
          .from('expert_availability')
          .select('*')
          .eq('expert_id', user.id);

        if (availData && availData.length > 0) {
          const days = availData
            .filter((a: any) => a.is_available)
            .map((a: any) => {
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return dayNames[a.day_of_week];
            });

          const firstAvail = availData[0];
          setAvailability({
            days,
            hoursStart: firstAvail.start_time || '09:00',
            hoursEnd: firstAvail.end_time || '17:00',
            sessionDuration: firstAvail.session_duration || 60,
            bufferTime: firstAvail.buffer_time || 10
          });
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view settings.</p>
      </div>
    );
  }

  const isExpert = user.role === 'expert';

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    ...(isExpert ? [{ id: 'availability', label: 'Availability' }] : [])
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        location: formData.location,
        website: formData.website,
        bio: formData.bio
      });

      if (isExpert && formData.hourlyRate) {
        await supabase
          .from('experts')
          .update({ hourly_rate: parseFloat(formData.hourlyRate) })
          .eq('user_id', user.id);
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          booking_confirmations: notifications.bookingConfirmations,
          reminders: notifications.reminders,
          marketing_updates: notifications.marketingUpdates,
          new_messages: notifications.newMessages,
          session_start: notifications.sessionStart,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvailabilitySave = async () => {
    setIsSaving(true);

    try {
      const { data: expert } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!expert) throw new Error('Expert profile not found');

      await supabase
        .from('expert_availability')
        .delete()
        .eq('expert_id', expert.id);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const availabilityData = availability.days.map(day => {
        const dayIndex = dayNames.indexOf(day);
        return {
          expert_id: expert.id,
          day_of_week: dayIndex,
          is_available: true,
          start_time: availability.hoursStart,
          end_time: availability.hoursEnd,
          session_duration: availability.sessionDuration,
          buffer_time: availability.bufferTime
        };
      });

      const { error } = await supabase
        .from('expert_availability')
        .insert(availabilityData);

      if (error) throw error;
      toast.success('Availability saved successfully');
    } catch (error) {
      toast.error('Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProfileSettings = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
        <div className="mt-2 flex items-center space-x-6">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 relative group">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="bg-white px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploadAvatar.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : 'Change Photo'}
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 5MB.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={formData.email}
              disabled
              className="block w-full pl-10 pr-3 py-2 border rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
      </div>

      {isExpert && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company/Organization</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Bio</label>
        <div className="mt-1">
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Changes
            </>
          )}
        </motion.button>
      </div>
    </form>
  );

  const renderAccountSettings = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <motion.button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Update Password
            </motion.button>
          </div>
        </form>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
        <p className="text-gray-600 mb-4">
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        <motion.button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              toast.error('Account deletion requires contacting support');
            }
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AlertCircle className="h-4 w-4" />
          Delete Account
        </motion.button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'bookingConfirmations', label: 'Booking Confirmations', description: 'Receive emails when a booking is confirmed' },
            { key: 'reminders', label: 'Reminders', description: 'Get reminders before your scheduled sessions' },
            { key: 'marketingUpdates', label: 'Marketing Updates', description: 'Receive news and promotional offers' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications[item.key as keyof NotificationPreferences]}
                  onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'newMessages', label: 'New Messages', description: 'Get notified when you receive new messages' },
            { key: 'sessionStart', label: 'Session Start', description: 'Get notified when your session is about to start' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications[item.key as keyof NotificationPreferences]}
                  onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="button"
          onClick={handleNotificationSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </motion.button>
      </div>
    </div>
  );

  const renderAvailabilitySettings = () => (
    <div className="space-y-6">
      <div>
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
                value={availability.hoursStart}
                onChange={(e) => setAvailability({ ...availability, hoursStart: e.target.value })}
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
                value={availability.hoursEnd}
                onChange={(e) => setAvailability({ ...availability, hoursEnd: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Working Days</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
            <label key={day} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={availability.days.includes(day)}
                onChange={(e) => {
                  const days = e.target.checked
                    ? [...availability.days, day]
                    : availability.days.filter(d => d !== day);
                  setAvailability({ ...availability, days });
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Duration</h3>
        <div className="space-y-3">
          {[30, 60, 90].map((duration) => (
            <label key={duration} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="duration"
                checked={availability.sessionDuration === duration}
                onChange={() => setAvailability({ ...availability, sessionDuration: duration })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">
                {duration === 60 ? '1 hour' : `${duration} minutes`}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Buffer Time Between Sessions</h3>
        <select
          value={availability.bufferTime}
          onChange={(e) => setAvailability({ ...availability, bufferTime: parseInt(e.target.value) })}
          className="block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="0">No buffer</option>
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
        </select>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="button"
          onClick={handleAvailabilitySave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Availability
            </>
          )}
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b overflow-x-auto">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && renderProfileSettings()}
            {activeTab === 'account' && renderAccountSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'availability' && isExpert && renderAvailabilitySettings()}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
