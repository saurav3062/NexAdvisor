import React, { useState } from 'react';
import { useExperts } from '../hooks/useExperts';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { categories } from '../data/categories';
import { motion } from 'framer-motion';
import { FadeIn } from '../components/animations/FadeIn';
import { ExpertCard } from '../components/experts/ExpertCard';

export function ExpertsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data, isLoading, error } = useExperts(
    selectedCategory === 'All Categories' ? undefined : selectedCategory,
    searchQuery
  );

  const experts = data?.experts || [];
  const total = data?.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Experts</h1>
            <p className="text-gray-600 mt-2">
              {total} experts available for consultation
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experts..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white w-full sm:w-auto"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 md:hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SlidersHorizontal className="h-5 w-5 text-gray-500" />
              <span>Filters</span>
            </motion.button>
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-600 text-lg">Failed to load experts. Please try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Retry
          </button>
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 text-lg">No experts found matching your criteria</p>
          <button 
            onClick={() => {
              setSelectedCategory('All Categories');
              setSearchQuery('');
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {experts.map((expert, index) => (
            <FadeIn key={expert.id || index} delay={index * 0.05}>
              <ExpertCard expert={expert} index={index} />
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}