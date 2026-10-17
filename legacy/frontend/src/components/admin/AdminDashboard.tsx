'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, DollarSign, TrendingUp,
  Settings, Shield, Database, BarChart3, UserCheck, UserX, Clock, LayoutDashboard, CheckCircle
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { adminService } from '../../services/supabaseApi';
import { useAuth } from '../../hooks/useAuth';
import { FadeIn } from '../animations/FadeIn';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ExpertVerification } from './ExpertVerification';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type TabType = 'overview' | 'verification' | 'users' | 'settings';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExperts: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0
  });
  const [bookingsByStatus, setBookingsByStatus] = useState<Record<string, number>>({});
  const [bookingsByCategory, setBookingsByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats();
    }
  }, [timeRange, activeTab]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [statsData, statusData, categoryData] = await Promise.all([
        adminService.getStats(),
        adminService.getBookingsByStatus(),
        adminService.getBookingsByCategory()
      ]);

      setStats(statsData);
      setBookingsByStatus(statusData);
      setBookingsByCategory(categoryData);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'verification' as const, label: 'Expert Verification', icon: UserCheck },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'verification':
        return <ExpertVerification />;

      case 'users':
        return <UserManagement />;

      case 'settings':
        return <AdminSettings />;

      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    const statsCards = [
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        icon: Users,
        color: 'bg-blue-500'
      },
      {
        title: 'Total Experts',
        value: stats.totalExperts.toLocaleString(),
        icon: UserCheck,
        color: 'bg-green-500'
      },
      {
        title: 'Total Bookings',
        value: stats.totalBookings.toLocaleString(),
        icon: Calendar,
        color: 'bg-purple-500'
      },
      {
        title: 'Active Sessions',
        value: stats.activeBookings.toLocaleString(),
        icon: Clock,
        color: 'bg-orange-500'
      },
      {
        title: 'Total Revenue',
        value: `$${stats.totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'bg-emerald-500'
      },
      {
        title: 'Growth Rate',
        value: '23%',
        icon: TrendingUp,
        color: 'bg-indigo-500'
      }
    ];

    const revenueData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [65000, 78000, 85000, 92000, 105000, 118000],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };

    const userGrowthData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'New Users',
          data: [120, 190, 300, 250],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        }
      ]
    };

    const categoryLabels = Object.keys(bookingsByCategory);
    const categoryData = {
      labels: categoryLabels.length > 0 ? categoryLabels : ['Medical', 'Finance', 'Legal', 'Technology', 'Academic'],
      datasets: [
        {
          data: categoryLabels.length > 0
            ? Object.values(bookingsByCategory)
            : [30, 25, 20, 15, 10],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
        }
      ]
    };

    return (
      <>
        {/* Time Range Selector */}
        <div className="mb-8 flex justify-end">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 Days' :
                 range === '30d' ? '30 Days' :
                 range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
            <Line
              data={revenueData}
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Growth</h3>
            <Bar
              data={userGrowthData}
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
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Bookings by Category</h3>
            <div className="h-64">
              <Doughnut
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Bookings by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(bookingsByStatus).length > 0 ? (
                  Object.entries(bookingsByStatus).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-4 text-gray-500">
                    No booking data available
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage your platform</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {renderTabContent()}
        </FadeIn>
      </div>
    </div>
  );
}

// Simple placeholder components
function UserManagement() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        User Management
      </h3>
      <p className="text-gray-500">User management features coming soon. Use the verification tab to manage expert applications.</p>
    </div>
  );
}

function AdminSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Admin Settings
      </h3>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Platform Settings</h4>
          <p className="text-sm text-gray-500">Configure platform-wide settings and preferences.</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Security</h4>
          <p className="text-sm text-gray-500">Configure security settings and access controls.</p>
        </div>
      </div>
    </div>
  );
}
