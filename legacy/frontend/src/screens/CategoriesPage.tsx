'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase, Code, DollarSign, Scale, Heart, GraduationCap,
  Users, Star, ArrowRight, Search, Loader2
} from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { useSupabaseCategories } from '../hooks/useSupabaseCategories';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'briefcase': Briefcase,
  'code': Code,
  'dollar-sign': DollarSign,
  'scale': Scale,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'users': Users,
  'star': Star,
};

const defaultIcons = [Briefcase, Code, DollarSign, Scale, Heart, GraduationCap, Users, Star];

function getCategoryIcon(iconName: string | null, index: number) {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return defaultIcons[index % defaultIcons.length];
}

const gradientColors = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-rose-500 to-rose-600',
];

export function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories, isLoading, error } = useSupabaseCategories();

  const filteredCategories = categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/experts?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 lg:py-24">
        <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Browse Expert Categories
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Explore our diverse range of expert categories and find the perfect consultant for your needs
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12 lg:py-16">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600">Failed to load categories. Please try again.</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Try adjusting your search query</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Categories', value: categories?.length || 0, icon: Briefcase },
                { label: 'Total Experts', value: categories?.reduce((sum, c) => sum + c.expertCount, 0) || 0, icon: Users },
                { label: 'Avg. Rate', value: `$${Math.round((categories?.reduce((sum, c) => sum + (c.averagePrice || 0), 0) || 0) / (categories?.length || 1)) || 0}/hr`, icon: DollarSign },
                { label: 'Rating', value: '4.9', icon: Star },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 text-center shadow-sm"
                >
                  <stat.icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category, index) => {
                const IconComponent = getCategoryIcon(category.icon, index);
                const gradient = gradientColors[index % gradientColors.length];

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div
                      onClick={() => handleCategoryClick(category.id)}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                    >
                      {/* Icon Header */}
                      <div className={`bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <IconComponent className="h-10 w-10 text-white" />
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                          {category.expertCount} {category.expertCount === 1 ? 'Expert' : 'Experts'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {category.description || `Find expert consultants in ${category.name} and get professional advice.`}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">${category.averagePrice}</span> avg/hour
                          </div>
                          <span className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                            Explore
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16 text-center"
            >
              <p className="text-gray-600 mb-4">Can't find what you're looking for?</p>
              <Link
                href="/experts"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Browse All Experts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
