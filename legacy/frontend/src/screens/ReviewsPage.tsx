'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Filter, Calendar, User, ThumbsUp, MessageSquare, Loader2 } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { FadeIn } from '../components/animations/FadeIn';
import { format } from 'date-fns';
import { useUserReviews, useCreateReview } from '../hooks/useReviews';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export function ReviewsPage() {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    bookingId: string;
    expertId: string;
    expertName: string;
    expertImage: string;
    service: string;
    date: string;
  } | null>(null);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reviewData, isLoading } = useUserReviews();
  const createReview = useCreateReview();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please log in to view your reviews.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const writtenReviews = reviewData?.written || [];
  const pendingReviews = reviewData?.pending || [];
  const reviews = writtenReviews.map((r: any) => ({
    id: r.id,
    expertId: r.expert_id,
    expertName: r.expert?.user?.name || 'Expert',
    expertImage: r.expert?.user?.avatar || '',
    rating: r.rating,
    comment: r.comment || '',
    date: r.created_at,
    bookingId: r.booking_id,
    service: r.service?.name || 'Consultation',
    helpful: r.helpful_count || 0,
    response: r.expert_response ? {
      text: r.expert_response,
      date: r.responded_at
    } : undefined
  }));

  const filteredReviews = reviews.filter(review =>
    filterRating === 0 || review.rating === filterRating
  );

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReview.mutateAsync({
        bookingId: selectedBooking.bookingId,
        expertId: selectedBooking.expertId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      });

      setShowReviewForm(false);
      setSelectedBooking(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewForm = (pending: typeof pendingReviews[0]) => {
    setSelectedBooking(pending);
    setShowReviewForm(true);
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setReviewForm({ ...reviewForm, rating: star })}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600 mt-2">Manage your reviews and rate your consultation experiences</p>
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Pending Reviews ({pendingReviews.length})
            </h2>
            <div className="space-y-4">
              {pendingReviews.map((pending: any) => (
                <div key={pending.bookingId} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {pending.expertImage ? (
                      <img
                        src={pending.expertImage}
                        alt={pending.expertName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{pending.expertName}</p>
                      <p className="text-sm text-gray-600">{pending.service}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(pending.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => openReviewForm(pending)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Star className="h-4 w-4" />
                    Write Review
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by rating:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterRating(0)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filterRating === 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(rating)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filterRating === rating ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500">
              {filterRating > 0
                ? `No ${filterRating}-star reviews found`
                : "You haven't written any reviews yet"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                  <div className="flex items-center space-x-4">
                    {review.expertImage ? (
                      <img
                        src={review.expertImage}
                        alt={review.expertName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-7 w-7 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{review.expertName}</h3>
                      <p className="text-sm text-gray-600">{review.service}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpful} helpful</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {review.response && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Expert Response</span>
                      <span className="text-xs text-blue-700">
                        {format(new Date(review.response.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-blue-800">{review.response.text}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </FadeIn>

      {/* Review Form Modal */}
      <Modal
        isOpen={showReviewForm}
        onClose={() => {
          setShowReviewForm(false);
          setSelectedBooking(null);
          setReviewForm({ rating: 5, comment: '' });
        }}
        title="Write a Review"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Expert Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedBooking.expertImage ? (
                <img
                  src={selectedBooking.expertImage}
                  alt={selectedBooking.expertName}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">{selectedBooking.expertName}</h3>
                <p className="text-sm text-gray-600">{selectedBooking.service}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(selectedBooking.date), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              {renderStars(reviewForm.rating, true)}
              <p className="text-sm text-gray-500 mt-1">
                {reviewForm.rating === 5 ? 'Excellent' :
                 reviewForm.rating === 4 ? 'Good' :
                 reviewForm.rating === 3 ? 'Average' :
                 reviewForm.rating === 2 ? 'Poor' : 'Terrible'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                rows={4}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your experience with this expert..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Submit Review
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
