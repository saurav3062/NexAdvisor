import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { Calendar, Clock, DollarSign, Users, Star, TrendingUp, MessageSquare, Award } from 'lucide-react';
import { format } from 'date-fns';
import { FadeIn } from '../components/animations/FadeIn';
import { BookingCard } from '../components/dashboard/BookingCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { UpcomingBookings } from '../components/dashboard/UpcomingBookings';
import { ExpertStats } from '../components/dashboard/ExpertStats';
import { ClientStats } from '../components/dashboard/ClientStats';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const [selectedView, setSelectedView] = useState<'overview' | 'bookings' | 'earnings' | 'reviews'>('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (profileLoading || bookingsLoading) {
    return <LoadingSpinner />;
  }

  const isExpert = user.role === 'expert';

  const stats = isExpert ? [
    { 
      label: 'Total Sessions', 
      value: profile?.totalBookings || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    { 
      label: 'Total Earnings', 
      value: `$${profile?.totalEarnings || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%'
    },
    { 
      label: 'Average Rating', 
      value: profile?.averageRating?.toFixed(1) || '0.0',
      icon: Star,
      color: 'bg-yellow-500',
      change: '+5%'
    },
    { 
      label: 'Response Rate', 
      value: '95%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+3%'
    }
  ] : [
    { 
      label: 'Total Consultations', 
      value: profile?.totalBookings || 0,
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    { 
      label: 'Hours Consulted', 
      value: ((profile?.totalBookings || 0) * 1.5).toFixed(1),
      icon: Clock,
      color: 'bg-green-500'
    },
    { 
      label: 'Active Bookings', 
      value: bookings?.filter(b => b.status === 'confirmed').length || 0,
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    { 
      label: 'Expert Network', 
      value: '200+',
      icon: Award,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-2">Here's an overview of your {isExpert ? 'expert' : 'client'} activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.1}>
              <div className="bg-white rounded-xl shadow-sm p-6">
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
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {isExpert ? <ExpertStats /> : <ClientStats />}
          </div>

          <div className="space-y-8">
            <UpcomingBookings bookings={bookings?.slice(0, 5) || []} />
            <ActivityFeed />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}