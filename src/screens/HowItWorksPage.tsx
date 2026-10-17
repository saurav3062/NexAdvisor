"use client";

import React from "react";
import { Search, Calendar, Video, Star, Shield, Users } from "lucide-react";

export function HowItWorksPage() {
  const steps = [
    {
      icon: <Search className="h-12 w-12" />,
      title: "Find Your Expert",
      description:
        "Browse approved expert profiles and compare expertise, ratings, experience, and prices.",
    },
    {
      icon: <Calendar className="h-12 w-12" />,
      title: "Book a Session",
      description:
        "Verify your email, choose a time in the expert’s UTC schedule, and check its local-time preview. Confirm your reservation with a simulated payment within 15 minutes.",
    },
    {
      icon: <Video className="h-12 w-12" />,
      title: "Video Consultation",
      description:
        "Open your confirmed booking for the external meeting link provided by your expert. Use booking messages to coordinate your session.",
    },
  ];

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Approved Experts",
      description:
        "Expert profiles are reviewed by an administrator before appearing publicly.",
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: "Quality Assured",
      description:
        "Clients can leave one review after their consultation is marked completed.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Global Network",
      description:
        "Access a diverse pool of experts from around the world, bringing you the best talent regardless of location.",
    },
  ];

  return (
    <div className="responsive-shell max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          How NexAdvisor Works
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Get expert advice in three simple steps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-blue-600">{step.icon}</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {step.title}
            </h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-12 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose NexAdvisor?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We are committed to providing the best consulting experience for
            both experts and clients
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Get Started?
        </h2>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-medium">
          Find Your Expert
        </button>
      </div>
    </div>
  );
}
