import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Users, Award, Clock, Briefcase, GraduationCap, MapPin, 
  Languages, Building2, Trophy, CheckCircle2, Sparkles, BadgeCheck,
  ThumbsUp, Calendar
} from 'lucide-react';
import { Expert } from '../../types';
import { Modal } from '../common/Modal';
import { ExpertStats } from './ExpertStats';
import { ExpertReviews } from './ExpertReviews';

interface ExpertProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onBook: () => void;
}

export const ExpertProfileModal: React.FC<ExpertProfileModalProps> = ({
  isOpen,
  onClose,
  expert,
  onBook
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expert Profile">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={expert.image}
              alt={expert.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{expert.name}</h2>
            <p className="text-xl text-blue-600 font-medium mb-3">{expert.expertise}</p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="ml-1 font-medium">{expert.rating}</span>
                <span className="ml-1 text-gray-500">({expert.reviews} reviews)</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-1" />
                {expert.location}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <ExpertStats expert={expert} />

        {/* About Section */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
          <p className="text-gray-700 text-lg leading-relaxed">{expert.bio}</p>
        </div>

        {/* Experience & Education */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Experience</h3>
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Briefcase className="h-5 w-5 text-blue-500 mr-2" />
                <span>{expert.yearsOfExperience} years of experience</span>
              </div>
              {expert.company && (
                <div className="flex items-center text-gray-700">
                  <Building2 className="h-5 w-5 text-blue-500 mr-2" />
                  <span>{expert.company}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Education</h3>
            <div className="space-y-3">
              {expert.education?.map((edu, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
                  <span>{edu}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills & Expertise */}
        {expert.skills && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {expert.skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium flex items-center"
                >
                  <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {expert.certifications && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Certifications</h3>
            <div className="grid grid-cols-2 gap-4">
              {expert.certifications.map((cert, index) => (
                <div
                  key={index}
                  className="bg-green-50 p-4 rounded-lg flex items-center"
                >
                  <BadgeCheck className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <ExpertReviews expertId={expert.id} />

        {/* Booking Footer */}
        <div className="sticky bottom-0 bg-white py-4 border-t mt-8 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">${expert.hourlyRate}</p>
            <p className="text-gray-600">per hour</p>
          </div>
          <motion.button
            onClick={onBook}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="h-5 w-5" />
            Book Consultation
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};