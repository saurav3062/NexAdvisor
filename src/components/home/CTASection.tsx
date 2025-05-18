import React from 'react';

interface CTASectionProps {
  onSignup: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onSignup }) => {
  return (
    <div className="bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Share Your Expertise?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join NexAdvisor as a consultant and start helping clients worldwide
          </p>
          <button 
            onClick={onSignup}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 text-lg font-semibold"
          >
            Register as a Professional
          </button>
        </div>
      </div>
    </div>
  );
};