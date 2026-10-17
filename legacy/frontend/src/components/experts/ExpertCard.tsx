import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Calendar, Clock, BadgeCheck, Heart, MessageSquare, ThumbsUp } from 'lucide-react';
import { Expert } from '../../types';
import { BookingModal } from '../booking/BookingModal';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { favoriteService } from '../../services/supabaseApi';
import toast from 'react-hot-toast';

interface ExpertCardProps {
  expert: Expert;
  variant?: 'grid' | 'list';
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, variant = 'grid' }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (user && expert) {
      checkFavoriteStatus();
    }
  }, [user, expert]);

  const checkFavoriteStatus = async () => {
    try {
      const isFav = await favoriteService.isFavorite(user!.id, expert.id);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to save favorites');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.remove(user!.id, expert.id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await favoriteService.add(user!.id, expert.id);
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

  // List variant
  if (variant === 'list') {
    return (
      <>
        <motion.article
          className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="w-full sm:w-40 h-40 sm:h-auto flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                src={expert.image}
                alt={expert.name}
                loading="lazy"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{expert.name}</h3>
                    <BadgeCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  </div>
                  <p className="text-blue-600 font-medium text-sm">{expert.expertise}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-gray-900">${expert.hourlyRate}</p>
                  <p className="text-xs text-gray-500">per hour</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-gray-900">{expert.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({expert.reviews})</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{expert.location}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{expert.availability}</span>
                </div>
              </div>

              {expert.skills && expert.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {expert.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {expert.skills.length > 4 && (
                    <span className="px-2.5 py-1 text-gray-500 text-xs">
                      +{expert.skills.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <Link
                  href={`/experts/${expert.id}`}
                  className="flex-1 text-center py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  View Profile
                </Link>
                <motion.button
                  onClick={() => setShowBookingModal(true)}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar className="h-4 w-4" />
                  Book Now
                </motion.button>
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.article>

        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          expert={expert}
        />
      </>
    );
  }

  // Grid variant (default)
  return (
    <>
      <motion.article
        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Favorite Button - Shows on Hover */}
        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-3 left-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        {/* Rate Badge */}
        <div className="absolute top-3 right-3 z-9 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-sm font-bold text-blue-600">
          ${expert.hourlyRate}/hr
        </div>

        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={expert.image}
            alt={expert.name}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Availability Badge */}
          {expert.availability === 'Available' && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/90 text-white rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Available now
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name & Title */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-1.5">
              {expert.name}
              <BadgeCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </h3>
            <p className="text-blue-600 font-medium text-sm truncate">{expert.expertise}</p>
          </div>

          {/* Rating & Location */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-900">{expert.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({expert.reviews})</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{expert.location}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-bold text-gray-900">{expert.totalConsultations}+</p>
              <p className="text-xs text-gray-500">Sessions</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-bold text-gray-900">{expert.yearsOfExperience}</p>
              <p className="text-xs text-gray-500">Years</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg flex flex-col items-center">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-gray-500 mt-0.5">{expert.successRate}%</p>
            </div>
          </div>

          {/* Skills */}
          {expert.skills && expert.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
              {expert.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs truncate max-w-[80px]"
                >
                  {skill}
                </span>
              ))}
              {expert.skills.length > 3 && (
                <span className="text-xs text-gray-400">+{expert.skills.length - 3}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href={`/experts/${expert.id}`}
              className="flex-1 text-center py-2.5 px-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              View Profile
            </Link>
            <motion.button
              onClick={() => setShowBookingModal(true)}
              className="flex-1 py-2.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-1.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="h-4 w-4" />
              Book
            </motion.button>
          </div>
        </div>
      </motion.article>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        expert={expert}
      />
    </>
  );
};
