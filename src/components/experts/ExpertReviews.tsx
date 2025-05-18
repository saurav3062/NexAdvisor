import React from 'react';
import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useExpertReviews } from '../../hooks/useExperts';

interface ExpertReviewsProps {
  expertId: string;
}

export const ExpertReviews: React.FC<ExpertReviewsProps> = ({ expertId }) => {
  const { data: reviews, isLoading } = useExpertReviews(expertId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Ensure reviews is an array before attempting to map
  const reviewsArray = Array.isArray(reviews) ? reviews : [];

  if (reviewsArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No reviews yet
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Client Reviews</h3>
      <div className="space-y-4">
        {reviewsArray.map((review) => (
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
    </div>
  );
};