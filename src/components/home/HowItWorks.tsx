import React from "react";
import { Search, Calendar, Video } from "lucide-react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: (
        <Search className="h-12 w-12 2xl:h-14 2xl:w-14 3xl:h-16 3xl:w-16" />
      ),
      title: "Find an Expert",
      desc: "Browse through approved experts in your required domain",
    },
    {
      icon: (
        <Calendar className="h-12 w-12 2xl:h-14 2xl:w-14 3xl:h-16 3xl:w-16" />
      ),
      title: "Book a Session",
      desc: "Schedule a consultation at your convenient time",
    },
    {
      icon: <Video className="h-12 w-12 2xl:h-14 2xl:w-14 3xl:h-16 3xl:w-16" />,
      title: "Video Consultation",
      desc: "Use the meeting link shared by your expert for your session",
    },
  ];

  return (
    <div className="bg-gray-50 py-16 2xl:py-24 3xl:py-32">
      <div className="responsive-shell max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        <h2 className="text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-center text-gray-900 mb-12 2xl:mb-16 3xl:mb-20">
          How NexAdvisor Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 2xl:gap-12 3xl:gap-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center p-6 2xl:p-8 3xl:p-12 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-blue-600 flex justify-center mb-4 3xl:mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl font-semibold text-gray-900 mb-2 3xl:mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 2xl:text-lg 3xl:text-xl">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
