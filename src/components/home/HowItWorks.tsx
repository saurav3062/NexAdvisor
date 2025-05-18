import React from 'react';
import { Search, Calendar, Video } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    { icon: <Search className="h-12 w-12" />, title: 'Find an Expert', desc: 'Browse through verified professionals in your required domain' },
    { icon: <Calendar className="h-12 w-12" />, title: 'Book a Session', desc: 'Schedule a consultation at your convenient time' },
    { icon: <Video className="h-12 w-12" />, title: 'Video Consultation', desc: 'Connect via secure video conference for your session' },
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How NexAdvisor Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="text-blue-600 flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};