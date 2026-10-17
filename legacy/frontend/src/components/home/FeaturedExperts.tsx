import React from 'react';
import Link from 'next/link';
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
    <div className="bg-gradient-to-b from-gray-50 to-white py-24 2xl:py-32 3xl:py-40">
      <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        <FadeIn>
          <div className="text-center mb-16 2xl:mb-20 3xl:mb-24">
            <h2 className="text-4xl 2xl:text-5xl 3xl:text-6xl font-bold text-gray-900 mb-4 3xl:mb-6">
              Meet Our Featured Experts
            </h2>
            <p className="text-xl 2xl:text-2xl 3xl:text-3xl text-gray-600 max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl mx-auto">
              Connect with our top-rated professionals and get personalized guidance from industry leaders
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-4 4xl:grid-cols-5 gap-8 2xl:gap-10 3xl:gap-12">
          {Array.isArray(experts) && experts.map((expert, index) => (
            <FadeIn key={expert.id} delay={index * 0.1}>
              <ExpertCard expert={expert} />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <div className="mt-16 text-center">
            <Link
              href="/experts"
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