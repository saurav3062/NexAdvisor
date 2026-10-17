import React from "react";
import { Shield, Clock, Globe, Star } from "lucide-react";

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: <Shield className="h-8 w-8 2xl:h-10 2xl:w-10 3xl:h-12 3xl:w-12" />,
      title: "Approved Experts",
      desc: "Expert profiles are reviewed before appearing in the directory",
    },
    {
      icon: <Clock className="h-8 w-8 2xl:h-10 2xl:w-10 3xl:h-12 3xl:w-12" />,
      title: "Flexible Scheduling",
      desc: "Choose from each expert’s available consultation times",
    },
    {
      icon: <Globe className="h-8 w-8 2xl:h-10 2xl:w-10 3xl:h-12 3xl:w-12" />,
      title: "Global Network",
      desc: "Access experts worldwide across all time zones",
    },
    {
      icon: <Star className="h-8 w-8 2xl:h-10 2xl:w-10 3xl:h-12 3xl:w-12" />,
      title: "Quality Assured",
      desc: "Read feedback from clients with completed consultations",
    },
  ];

  return (
    <div className="bg-white py-16 2xl:py-24 3xl:py-32">
      <div className="responsive-shell max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        <h2 className="text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-center text-gray-900 mb-12 2xl:mb-16 3xl:mb-20">
          Why Choose NexAdvisor
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 2xl:gap-12 3xl:gap-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 2xl:p-8 3xl:p-12 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all duration-200"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 2xl:w-20 2xl:h-20 3xl:w-24 3xl:h-24 bg-blue-50 rounded-2xl mb-4 3xl:mb-6 text-blue-600">
                {feature.icon}
              </div>
              <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl font-semibold text-gray-900 mb-2 3xl:mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 2xl:text-lg 3xl:text-xl">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
