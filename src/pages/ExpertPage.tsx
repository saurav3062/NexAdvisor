import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useExpert } from '../hooks/useExperts';
import { Star, MapPin, Clock, Calendar, Award, Users, Languages, GraduationCap, Building2, BadgeCheck } from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { motion } from 'framer-motion';
import { BookingModal } from '../components/experts/BookingModal';
import { FloatingBookButton } from '../components/common/FloatingBookButton';

export function ExpertPage() {
  const { id } = useParams();
  const { data: expert, isLoading, error } = useExpert(id || '');
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Expert not found</h2>
          <p className="text-gray-600">The expert you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-lg">
                <img 
                  src={expert.image} 
                  alt={expert.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-50 px-3 py-1 rounded-full text-sm font-medium text-blue-600">
                    {expert.category}
                  </span>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{expert.rating}</span>
                    <span className="text-gray-500">({expert.reviews} reviews)</span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">{expert.name}</h1>
                <p className="text-lg text-blue-600 mb-3">{expert.expertise}</p>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {expert.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{expert.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{expert.availability}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>${expert.hourlyRate}/hour</span>
                  </div>
                </div>
              </div>

              <div className="ml-auto">
                <motion.button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar className="h-5 w-5" />
                  Book Consultation
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <FadeIn delay={0.1}>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Users className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Total Sessions</h3>
                <p className="text-2xl font-bold text-gray-900">{expert.totalConsultations}+</p>
                <p className="text-gray-600">successful consultations</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Award className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Experience</h3>
                <p className="text-2xl font-bold text-gray-900">{expert.yearsOfExperience}</p>
                <p className="text-gray-600">years of expertise</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Star className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Success Rate</h3>
                <p className="text-2xl font-bold text-gray-900">{expert.successRate}%</p>
                <p className="text-gray-600">client satisfaction</p>
              </div>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <FadeIn>
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed">{expert.bio}</p>

                  {expert.languages && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 text-gray-900 mb-2">
                        <Languages className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">Languages</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {expert.languages.map((language) => (
                          <span key={language} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>

              {expert.skills && (
                <FadeIn>
                  <div className="bg-white rounded-lg p-8 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Skills & Expertise</h2>
                    <div className="flex flex-wrap gap-2">
                      {expert.skills.map((skill) => (
                        <span key={skill} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}

              {expert.certifications && (
                <FadeIn>
                  <div className="bg-white rounded-lg p-8 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Certifications</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {expert.certifications.map((cert) => (
                        <div key={cert} className="flex items-center gap-2 bg-green-50 p-4 rounded-lg">
                          <BadgeCheck className="h-5 w-5 text-green-600" />
                          <span className="text-gray-900">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}
            </div>

            <div className="space-y-6">
              <FadeIn>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">Experience</h2>
                  {expert.company && (
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{expert.company}</p>
                        <p className="text-sm text-gray-600">Current Position</p>
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">Education</h2>
                  <div className="space-y-4">
                    {expert.education?.map((edu) => (
                      <div key={edu} className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        <p className="text-gray-900">{edu}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>

      <FloatingBookButton onClick={() => setShowBookingModal(true)} />

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        expert={expert}
      />
    </>
  );
}