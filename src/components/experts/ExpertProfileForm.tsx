import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Clock, Calendar, MapPin, Globe, Languages, GraduationCap, Award, Plus, Trash2 } from 'lucide-react';
import { ExpertImageUpload } from './ExpertImageUpload';
import { ExpertSkillsInput } from './ExpertSkillsInput';

const expertProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().min(2, 'Title is required'),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  shortBio: z.string().max(160, 'Short bio must be less than 160 characters'),
  expertise: z.array(z.string()).min(1, 'At least one expertise is required'),
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.enum(['basic', 'conversational', 'fluent', 'native'])
  })).min(1, 'At least one language is required'),
  location: z.object({
    country: z.string(),
    city: z.string().optional(),
    timezone: z.string()
  }),
  hourlyRate: z.number().min(1, 'Hourly rate is required'),
  availability: z.object({
    workingDays: z.array(z.string()),
    workingHours: z.object({
      start: z.string(),
      end: z.string()
    }),
    bufferTime: z.number().min(0).max(60),
    customBreaks: z.array(z.object({
      day: z.string(),
      start: z.string(),
      end: z.string()
    })).optional()
  }),
  services: z.array(z.object({
    name: z.string(),
    description: z.string(),
    duration: z.number(),
    price: z.number(),
    maxParticipants: z.number().optional()
  })).min(1, 'At least one service is required'),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    issueDate: z.string(),
    expiryDate: z.string().optional(),
    credentialUrl: z.string().optional()
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    startDate: z.string(),
    endDate: z.string().optional()
  })),
  settings: z.object({
    autoAcceptBookings: z.boolean(),
    notificationPreferences: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean()
    }),
    cancellationPolicy: z.object({
      minimumNotice: z.number(),
      refundPercentage: z.number()
    })
  })
});

type ExpertProfileFormData = z.infer<typeof expertProfileSchema>;

interface ExpertProfileFormProps {
  initialData?: Partial<ExpertProfileFormData>;
  onSubmit: (data: ExpertProfileFormData) => void;
  isLoading?: boolean;
}

export function ExpertProfileForm({ initialData, onSubmit, isLoading }: ExpertProfileFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ExpertProfileFormData>({
    resolver: zodResolver(expertProfileSchema),
    defaultValues: initialData
  });

  const workingDays = watch('availability.workingDays');
  const services = watch('services');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <Controller
              name="profileImage"
              control={control}
              render={({ field }) => (
                <ExpertImageUpload
                  currentImage={field.value}
                  onUpload={(file) => field.onChange(file)}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Professional Title</label>
            <input
              type="text"
              {...register('title')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Short Bio</label>
            <textarea
              {...register('shortBio')}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.shortBio && (
              <p className="mt-1 text-sm text-red-600">{errors.shortBio.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Expertise and Skills */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Expertise & Skills</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Areas of Expertise</label>
            <Controller
              name="expertise"
              control={control}
              render={({ field }) => (
                <ExpertSkillsInput
                  skills={field.value}
                  onChange={field.onChange}
                  suggestions={[
                    'Cardiology',
                    'Investment Strategy',
                    'Software Architecture',
                    'Business Consulting',
                    'Legal Advisory'
                  ]}
                />
              )}
            />
            {errors.expertise && (
              <p className="mt-1 text-sm text-red-600">{errors.expertise.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Languages</label>
            <div className="mt-2 space-y-4">
              {watch('languages')?.map((_, index) => (
                <div key={index} className="flex gap-4">
                  <select
                    {...register(`languages.${index}.language`)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select language</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                  
                  <select
                    {...register(`languages.${index}.proficiency`)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="conversational">Conversational</option>
                    <option value="fluent">Fluent</option>
                    <option value="native">Native</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const languages = watch('languages');
                      const newLanguages = languages.filter((_, i) => i !== index);
                      control.setValue('languages', newLanguages);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  const languages = watch('languages') || [];
                  control.setValue('languages', [
                    ...languages,
                    { language: '', proficiency: 'basic' }
                  ]);
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Language
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Settings */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Availability</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Working Days</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('availability.workingDays')}
                    value={day}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  {...register('availability.workingHours.start')}
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
                  {...register('availability.workingHours.end')}
                  className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Buffer Time (minutes)</label>
            <select
              {...register('availability.bufferTime', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Services</h3>
        
        <div className="space-y-6">
          {services?.map((_, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Name</label>
                  <input
                    type="text"
                    {...register(`services.${index}.name`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                  <select
                    {...register(`services.${index}.duration`, { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      {...register(`services.${index}.price`, { valueAsNumber: true })}
                      className="block w-full pl-7 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                  <input
                    type="number"
                    {...register(`services.${index}.maxParticipants`, { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register(`services.${index}.description`)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const newServices = services.filter((_, i) => i !== index);
                    control.setValue('services', newServices);
                  }}
                  className="text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Service
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const newService = {
                name: '',
                description: '',
                duration: 60,
                price: 0,
                maxParticipants: 1
              };
              control.setValue('services', [...(services || []), newService]);
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Certifications and Education */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Credentials</h3>
        
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Certifications</h4>
              <button
                type="button"
                onClick={() => {
                  const certifications = watch('certifications') || [];
                  control.setValue('certifications', [
                    ...certifications,
                    {
                      name: '',
                      issuer: '',
                      issueDate: '',
                      expiryDate: '',
                      credentialUrl: ''
                    }
                  ]);
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Certification
              </button>
            </div>

            <div className="space-y-4">
              {watch('certifications')?.map((_, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        {...register(`certifications.${index}.name`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issuer</label>
                      <input
                        type="text"
                        {...register(`certifications.${index}.issuer`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                      <input
                        type="date"
                        {...register(`certifications.${index}.issueDate`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <input
                        type="date"
                        {...register(`certifications.${index}.expiryDate`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Credential URL</label>
                    <input
                      type="url"
                      {...register(`certifications.${index}.credentialUrl`)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const certifications = watch('certifications');
                        const newCertifications = certifications.filter((_, i) => i !== index);
                        control.setValue('certifications', newCertifications);
                      }}
                      className="text-red-600 hover:text-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Education</h4>
              <button
                type="button"
                onClick={() => {
                  const education = watch('education') || [];
                  control.setValue('education', [
                    ...education,
                    {
                      institution: '',
                      degree: '',
                      field: '',
                      startDate: '',
                      endDate: ''
                    }
                  ]);
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Education
              </button>
            </div>

            <div className="space-y-4">
              {watch('education')?.map((_, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institution</label>
                      <input
                        type="text"
                        {...register(`education.${index}.institution`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Degree</label>
                      <input
                        type="text"
                        {...register(`education.${index}.degree`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                      <input
                        type="text"
                        {...register(`education.${index}.field`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                          type="date"
                          {...register(`education.${index}.startDate`)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                          type="date"
                          {...register(`education.${index}.endDate`)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const education = watch('education');
                        const newEducation = education.filter((_, i) => i !== index);
                        control.setValue('education', newEducation);
                      }}
                      className="text-red-600 hover:text-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('settings.autoAcceptBookings')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Automatically accept booking requests</span>
            </label>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Preferences</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('settings.notificationPreferences.email')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Email notifications</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('settings.notificationPreferences.sms')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">SMS notifications</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('settings.notificationPreferences.push')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Push notifications</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Cancellation Policy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Notice (hours)</label>
                <input
                  type="number"
                  {...register('settings.cancellationPolicy.minimumNotice', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Refund Percentage</label>
                <input
                  type="number"
                  {...register('settings.cancellationPolicy.refundPercentage', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </motion.button>
      </div>
    </form>
  );
}