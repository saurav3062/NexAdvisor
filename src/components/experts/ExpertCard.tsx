import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, GraduationCap, Building2, Calendar, Clock, Award, BadgeCheck, Users, ThumbsUp } from 'lucide-react';
import { Expert } from '../../types';
import { BookingModal } from './BookingModal';
import { Link } from 'react-router-dom';

interface ExpertCardProps {
  expert: Expert;
  index?: number;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, index = 0 }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <>
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col relative"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        {/* Rate Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-blue-600 shadow-sm">
          ${expert.hourlyRate}/hr
        </div>

        {/* Expert Image and Basic Info */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
            <img 
              className="w-full h-full object-cover"
              src={expert.image}
              alt={expert.name}
              loading="lazy"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {expert.name}
            </h3>
            
            <p className="text-blue-600 font-medium mb-2">
              {expert.expertise}
            </p>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="ml-1 font-medium">{expert.rating}</span>
                <span className="ml-1 text-sm text-gray-500">({expert.reviews})</span>
              </div>
              {expert.successRate && (
                <div className="flex items-center bg-green-50 px-2 py-1 rounded-lg">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="ml-1 font-medium">{expert.successRate}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              {expert.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{expert.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{expert.availability}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="px-6 grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-900">{expert.totalConsultations}+</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Award className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-900">{expert.yearsOfExperience}</p>
            <p className="text-xs text-gray-500">Years Exp.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Star className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-900">{expert.rating}/5</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>

        {/* Skills and Certifications */}
        <div className="px-6 mb-4">
          {expert.skills && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {expert.skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
                {expert.skills.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{expert.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {expert.certifications && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Certifications</h4>
              <div className="space-y-1">
                {expert.certifications.slice(0, 2).map((cert) => (
                  <div key={cert} className="flex items-center gap-2 text-xs text-gray-600">
                    <BadgeCheck className="h-4 w-4 text-green-500" />
                    <span>{cert}</span>
                  </div>
                ))}
                {expert.certifications.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{expert.certifications.length - 2} more certifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto p-6 pt-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <Link 
              to={`/experts/${expert.id}`}
              className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-center border"
            >
              View Profile
            </Link>
            <motion.button 
              onClick={() => setShowBookingModal(true)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="h-5 w-5" />
              Book Now
            </motion.button>
          </div>
        </div>
      </motion.div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        expert={expert}
      />
    </>
  );
};