import React from "react";

interface CTASectionProps {
  onSignup: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onSignup }) => {
  return (
    <div className="bg-blue-600">
      <div className="responsive-shell max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-16 2xl:py-24 3xl:py-32">
        <div className="text-center">
          <h2 className="text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-white mb-4 3xl:mb-6">
            Ready to Share Your Expertise?
          </h2>
          <p className="text-xl 2xl:text-2xl 3xl:text-3xl text-blue-100 mb-8 3xl:mb-12 max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl mx-auto">
            Join NexAdvisor as a consultant and start helping clients worldwide
          </p>
          <button
            onClick={onSignup}
            className="bg-white text-blue-600 px-8 py-3 3xl:px-12 3xl:py-5 3xl:text-xl rounded-lg hover:bg-blue-50 text-lg font-semibold transition-colors duration-200"
          >
            Register as a Professional
          </button>
        </div>
      </div>
    </div>
  );
};
