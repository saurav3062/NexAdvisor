import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium">{stat.label}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          {stat.change && (
            <p className="text-sm font-medium text-green-600 mt-2">
              {stat.change} from last month
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}