import React from 'react';
import { Users, Award, Clock, Star } from 'lucide-react';
import { Expert } from '../../types';

interface ExpertStatsProps {
  expert: Expert;
}

export const ExpertStats: React.FC<ExpertStatsProps> = ({ expert }) => {
  const stats = [
    {
      icon: Users,
      label: 'Total Sessions',
      value: expert.totalConsultations,
      suffix: '+ sessions'
    },
    {
      icon: Award,
      label: 'Experience',
      value: expert.yearsOfExperience,
      suffix: ' years'
    },
    {
      icon: Star,
      label: 'Success Rate',
      value: expert.successRate,
      suffix: '%'
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24h'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <stat.icon className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
          <p className="text-lg font-semibold text-gray-900">
            {stat.value}{stat.suffix}
          </p>
        </div>
      ))}
    </div>
  );
};