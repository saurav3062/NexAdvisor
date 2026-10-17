import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { motion } from 'framer-motion';
import { useClientStats } from '../../hooks/useDashboardStats';
import { DollarSign, Users } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const COLORS = [
  'rgba(37, 99, 235, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(234, 179, 8, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(239, 68, 68, 0.8)',
];

export function ClientStats() {
  const { data: stats, isLoading } = useClientStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const categoryData = stats?.categoryData || [];

  const consultationChartData = {
    labels: categoryData.map(c => c.category),
    datasets: [
      {
        data: categoryData.map(c => c.count),
        backgroundColor: COLORS.slice(0, categoryData.length),
        borderWidth: 0,
      }
    ]
  };

  const spendingChartData = {
    labels: stats?.monthlyData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Consultation Spending',
        data: stats?.monthlyData.map(d => d.spending) || [],
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">${stats?.totalSpent?.toFixed(0) || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Experts Consulted</p>
              <p className="text-xl font-bold text-gray-900">{stats?.uniqueExperts || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Consultations by Category</h2>
        {categoryData.length > 0 ? (
          <div className="h-64">
            <Doughnut
              data={consultationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500">
            No consultations yet
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending Overview</h2>
        {(stats?.monthlyData.some(d => d.spending > 0)) ? (
          <Line
            data={spendingChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `$${value}`,
                  },
                },
              },
            }}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500">
            No spending data yet
          </div>
        )}
      </motion.div>
    </div>
  );
}
