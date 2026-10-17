'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useExpert, useExpertReviews, useExpertAvailability } from '../hooks/useExperts';
import { useAuth } from '../hooks/useAuth';
import { favoriteService } from '../services/supabaseApi';
import {
  Star, MapPin, Clock, Calendar, Award, Users, Languages, GraduationCap,
  Building2, BadgeCheck, Heart, Share2, MessageSquare, ChevronLeft,
  CheckCircle, Video, Phone, Globe
} from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BookingModal } from '../components/booking/BookingModal';
import { SEO } from '../components/seo/SEO';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import toast from 'react-hot-toast';

export function ExpertPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { data: expert, isLoading, error } = useExpert(id || '');
  const { data: reviewsData } = useExpertReviews(id || '');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const reviews = reviewsData?.reviews || [];
  const averageRating = reviewsData?.averageRating || expert?.rating || 0;

  useEffect(() => {
    if (user && expert) {
      checkFavoriteStatus();
    }
  }, [user, expert]);

  const checkFavoriteStatus = async () => {
    try {
      const isFav = await favoriteService.isFavorite(user!.id, expert!.id);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save favorites');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.remove(user!.id, expert!.id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await favoriteService.add(user!.id, expert!.id);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Expert not found</h2>
          <p className="text-gray-600 mb-6">
            The expert you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/experts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Browse Experts
          </Link>
        </div>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <>
      <SEO
        title={`${expert.name} - ${expert.expertise}`}
        description={expert.bio?.slice(0, 160)}
        type="profile"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link href="/experts" className="hover:text-blue-600">Experts</Link>
              <span>/</span>
              <span className="text-gray-900">{expert.name}</span>
            </nav>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Expert Info */}
              <div className="flex-1">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                      <img
                        src={expert.image}
                        alt={expert.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {expert.totalConsultations > 50 && (
                      <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-white">
                        Top Expert
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BadgeCheck className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Verified Expert</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{expert.name}</h1>
                    <p className="text-lg text-blue-600 font-medium mb-3">{expert.expertise}</p>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                        <span className="text-gray-500">({expert.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{expert.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      {expert.languages?.map((lang) => (
                        <span key={lang} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                          <Globe className="h-3.5 w-3.5 text-gray-500" />
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{expert.totalConsultations}+</p>
                    <p className="text-sm text-gray-600">Sessions</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{expert.yearsOfExperience}</p>
                    <p className="text-sm text-gray-600">Years Exp</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{expert.rating?.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{expert.successRate || 98}%</p>
                    <p className="text-sm text-gray-600">Success</p>
                  </div>
                </div>
              </div>

              {/* Booking Card */}
              <div className="lg:w-80">
                <div className="bg-white border rounded-2xl shadow-sm overflow-hidden sticky top-24">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-3xl font-bold text-gray-900">${expert.hourlyRate}</p>
                      <span className="text-gray-500">/hour</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={toggleFavorite}
                        disabled={favoriteLoading}
                        className={`p-3 rounded-xl border ${
                          isFavorite ? 'bg-red-50 border-red-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                      <button className="flex-1 p-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                        <span>Message</span>
                      </button>
                      <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                        <Share2 className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Date Picker */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <p className="font-medium text-gray-900">
                        {format(currentWeekStart, 'MMM yyyy')}
                      </p>
                      <button
                        onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="h-5 w-5 rotate-180" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-gray-400 font-medium py-1">{day}</div>
                      ))}
                      {weekDays.map((day) => (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`py-2 rounded-lg ${
                            selectedDate?.toDateString() === day.toDateString()
                              ? 'bg-blue-600 text-white'
                              : day < new Date()
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                          disabled={day < new Date()}
                        >
                          {format(day, 'd')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="p-6">
                    {selectedDate && (
                      <>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Available times on {format(selectedDate, 'MMM d')}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-2 px-3 text-sm rounded-lg border ${
                                selectedTime === time
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <motion.button
                      onClick={() => setShowBookingModal(true)}
                      disabled={!selectedDate || !selectedTime}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: selectedDate && selectedTime ? 1.02 : 1 }}
                      whileTap={{ scale: selectedDate && selectedTime ? 0.98 : 1 }}
                    >
                      {selectedDate && selectedTime
                        ? `Book for ${selectedTime}`
                        : 'Select a time'}
                    </motion.button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Response time: Within 2 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <FadeIn>
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {expert.bio || `${expert.name} is an experienced ${expert.expertise} professional with ${expert.yearsOfExperience} years of expertise.`}
                  </p>
                </div>
              </FadeIn>

              {/* Skills */}
              {expert.skills && expert.skills.length > 0 && (
                <FadeIn>
                  <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
                    <div className="flex flex-wrap gap-3">
                      {expert.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Certifications */}
              {expert.certifications && expert.certifications.length > 0 && (
                <FadeIn>
                  <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Certifications</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {expert.certifications.map((cert) => (
                        <div
                          key={cert}
                          className="flex items-center gap-3 p-4 bg-green-50 rounded-xl"
                        >
                          <BadgeCheck className="h-6 w-6 text-green-600 flex-shrink-0" />
                          <span className="text-gray-900">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Education */}
              {expert.education && expert.education.length > 0 && (
                <FadeIn>
                  <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Education</h2>
                    <div className="space-y-4">
                      {expert.education.map((edu, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{edu}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Reviews */}
              <FadeIn>
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-500">({reviews.length})</span>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-6">
                      {reviews.slice(0, 5).map((review: any) => (
                        <div key={review.id} className="border-b pb-6 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <img
                              src={review.clientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.clientName)}&background=gray&color=fff`}
                              alt={review.clientName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{review.clientName}</p>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                {new Date(review.date).toLocaleDateString()}
                              </p>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company */}
              {expert.company && (
                <FadeIn>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Current Position</h3>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <p className="text-gray-700">{expert.company}</p>
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Services Offered */}
              {expert.services && expert.services.length > 0 && (
                <FadeIn>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
                    <div className="space-y-3">
                      {expert.services.map((service: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{service.name || `Service ${i + 1}`}</p>
                            <p className="text-sm text-gray-500">{service.duration || 60} min</p>
                          </div>
                          <p className="font-semibold text-blue-600">${service.price || expert.hourlyRate}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        expert={expert}
        preselectedSlot={selectedDate && selectedTime ? {
          id: `${selectedDate.toISOString()}-${selectedTime}`,
          startTime: selectedDate.toISOString(),
          endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString(),
          duration: 60,
          available: true,
          price: expert.hourlyRate,
          currency: 'USD',
          bufferTimeStart: 0,
          bufferTimeEnd: 0
        } : undefined}
      />
    </>
  );
}
