import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Star, ExternalLink, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { usePendingExperts, useVerifyExpert, useRejectExpert, useFeatureExpert } from '../../hooks/useAdmin';
import { FadeIn } from '../animations/FadeIn';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export function ExpertVerification() {
  const { data: experts, isLoading } = usePendingExperts();
  const verifyMutation = useVerifyExpert();
  const rejectMutation = useRejectExpert();
  const featureMutation = useFeatureExpert();
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <LoadingSpinner />
      </div>
    );
  }

  const handleVerify = async (expertId: string) => {
    try {
      await verifyMutation.mutateAsync(expertId);
      toast.success('Expert verified successfully');
    } catch (error) {
      toast.error('Failed to verify expert');
    }
  };

  const handleReject = async (expertId: string) => {
    try {
      await rejectMutation.mutateAsync(expertId);
      toast.success('Expert application rejected');
    } catch (error) {
      toast.error('Failed to reject expert');
    }
  };

  const handleFeature = async (expertId: string, featured: boolean) => {
    try {
      await featureMutation.mutateAsync({ expertId, featured });
      toast.success(featured ? 'Expert featured' : 'Expert unfeatured');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  if (!experts || experts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500 mt-2">No pending expert applications to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
          Pending Expert Applications
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {experts.length}
          </span>
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        <AnimatePresence>
          {experts.map((expert) => (
            <motion.div
              key={expert.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {expert.users?.avatar_url ? (
                    <img
                      src={expert.users.avatar_url}
                      alt={expert.users.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-gray-500" />
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900">
                      {expert.users?.name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-gray-500">{expert.users?.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {expert.title && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {expert.title}
                        </span>
                      )}
                      {expert.categories?.name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {expert.categories.name}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ${expert.hourly_rate}/hr
                      </span>
                      {expert.rating > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          {expert.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Applied {formatDistanceToNow(new Date(expert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVerify(expert.id)}
                    disabled={verifyMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReject(expert.id)}
                    disabled={rejectMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </motion.button>
                  <a
                    href={`/experts/${expert.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
