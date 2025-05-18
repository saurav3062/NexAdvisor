import React from 'react';
import { Expert } from '../../types';
import { ExpertCard } from './ExpertCard';
import { useExperts } from '../../hooks/useExperts';
import { motion } from 'framer-motion';

interface ExpertsGridProps {
  category?: string;
  search?: string;
  sortBy?: 'rating' | 'experience' | 'price';
  filters?: {
    availability?: 'today' | 'this-week' | 'next-week';
    priceRange?: { min: number; max: number };
    languages?: string[];
    specializations?: string[];
  };
}

export const ExpertsGrid: React.FC<ExpertsGridProps> = ({
  category,
  search,
  sortBy,
  filters
}) => {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useExperts({
    category,
    search,
    sortBy,
    ...filters,
    limit: 12
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md animate-pulse h-96"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load experts</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const experts = data?.pages.flatMap(page => page.experts) || [];

  if (experts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No experts found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {experts.map((expert, index) => (
          <motion.div
            key={expert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ExpertCard expert={expert} />
          </motion.div>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};