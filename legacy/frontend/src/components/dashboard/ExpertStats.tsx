import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { motion } from 'framer-motion';
import { useExpertStats } from '../../hooks/useDashboardStats';
import { Users, DollarSign } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function ExpertStats() {
  const { data: stats, isLoading } = useExpertStats();

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

  const monthlyData = stats?.monthlyData || [];

  const bookingsChartData = {
    labels: monthlyData.map(d => d.label),
    datasets: [
      {
        label: 'Completed Sessions',
        data: monthlyData.map(d => d.bookings),
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
      }
    ]
  };

  const earningsChartData = {
    labels: monthlyData.map(d => d.label),
    datasets: [
      {
        label: 'Monthly Earnings',
        data: monthlyData.map(d => d.earnings),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
            <div className="bg-blue-100 rounded-lg p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clients Served</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
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
            <div className="bg-green-100 rounded-lg p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-lg font-bold text-gray-900">{stats?.categoryName || 'General'}</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sessions Overview</h2>
        {monthlyData.some(d => d.bookings > 0) ? (
          <Bar
            data={bookingsChartData}
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
                },
              },
            }}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500">
            No sessions data yet
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Earnings Trend</h2>
        {monthlyData.some(d => d.earnings > 0) ? (
          <Line
            data={earningsChartData}
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
            No earnings data yet
          </div>
        )}
      </motion.div>
    </div>
  );
}
