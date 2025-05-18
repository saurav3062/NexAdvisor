import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { Expert } from '../../types';
import { FadeIn } from '../animations/FadeIn';
import { ExpertCard } from '../experts/ExpertCard';

interface FeaturedExpertsProps {
  experts: Expert[];
}

export const FeaturedExperts: React.FC<FeaturedExpertsProps> = ({ experts = [] }) => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Featured Experts
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with our top-rated professionals and get personalized guidance from industry leaders
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.isArray(experts) && experts.map((expert, index) => (
            <FadeIn key={expert.id} delay={index * 0.1}>
              <ExpertCard expert={expert} index={index} />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <div className="mt-16 text-center">
            <Link
              to="/experts"
              className="inline-flex items-center gap-2 text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              View All Experts
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};