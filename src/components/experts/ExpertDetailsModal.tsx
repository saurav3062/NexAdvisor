import React from 'react';
import { 
  Star, Users, Award, Clock, Briefcase, GraduationCap, MapPin, 
  Languages, Building2, Trophy, CheckCircle2, Sparkles, BadgeCheck,
  ThumbsUp, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Expert } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';

interface ExpertDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onBook: () => void;
}

export const ExpertDetailsModal: React.FC<ExpertDetailsModalProps> = ({
  isOpen,
  onClose,
  expert,
  onBook
}) => {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && expert.id) {
      setLoading(true);
      api.experts.getReviews(expert.id)
        .then(data => setReviews(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, expert.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
            <img
              src={expert.image}
              alt={expert.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1 text-center">{expert.name}</h2>
          <p className="text-xl text-blue-600 font-medium mb-3 text-center">{expert.expertise}</p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="font-medium">{expert.rating}</span>
              <span className="text-gray-500">({expert.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-gray-700">{expert.totalConsultations}+ sessions</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">{expert.yearsOfExperience} years experience</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600 mb-6">
            {expert.company && (
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{expert.company}</span>
              </div>
            )}
            {expert.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{expert.location}</span>
              </div>
            )}
          </div>
          
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">{expert.bio}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {expert.languages && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Languages className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Languages</span>
                    </div>
                    <p className="text-gray-700 ml-7">{expert.languages.join(", ")}</p>
                  </div>
                )}
                
                {expert.education && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Education</span>
                    </div>
                    <ul className="list-disc list-inside text-gray-700 ml-7">
                      {expert.education.map((edu, index) => (
                        <li key={index}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {expert.skills && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.skills.map((skill, index) => (
                    <motion.span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
            
            {expert.certifications && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Certifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expert.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                      <BadgeCheck className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Client Reviews</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div 
                      key={review.id} 
                      className="bg-gray-50 rounded-lg p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                            {review.clientName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{review.clientName}</span>
                            <div className="text-sm text-gray-500">
                              {format(new Date(review.date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white py-4 border-t flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">${expert.hourlyRate}</p>
          <p className="text-gray-600">per hour</p>
        </div>
        <motion.button
          onClick={onBook}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-lg text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Calendar className="h-5 w-5" />
          Book Consultation
        </motion.button>
      </div>
    </Modal>
  );
};