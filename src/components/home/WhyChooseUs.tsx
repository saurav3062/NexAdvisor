import React from 'react';
import { Shield, Clock, Globe, Star } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    { icon: <Shield className="h-8 w-8" />, title: 'Verified Experts', desc: 'All professionals are thoroughly vetted' },
    { icon: <Clock className="h-8 w-8" />, title: 'Flexible Scheduling', desc: 'Book sessions at your convenience' },
    { icon: <Globe className="h-8 w-8" />, title: 'Global Network', desc: 'Access experts worldwide' },
    { icon: <Star className="h-8 w-8" />, title: 'Quality Assured', desc: 'Satisfaction guaranteed' },
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose NexAdvisor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-blue-600 flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};