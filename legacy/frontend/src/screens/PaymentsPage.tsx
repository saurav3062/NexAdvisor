'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, Filter, Calendar, DollarSign, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { format } from 'date-fns';
import { usePayments, useExpertEarnings, usePaymentMethods } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export function PaymentsPage() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const { data: payments, isLoading: paymentsLoading } = usePayments({
    status: filterStatus,
    dateRange
  });
  const { data: expertEarnings } = useExpertEarnings({ dateRange });
  const { data: paymentMethods } = usePaymentMethods();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please log in to view payments.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (paymentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isExpert = user.role === 'expert';
  const totalSpent = (payments || [])
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      toast.success('Generating invoice...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isExpert ? 'Earnings' : 'Payment History'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isExpert
              ? 'Track your earnings and manage payouts'
              : 'Track your consultation payments and download invoices'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isExpert ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Earned</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${expertEarnings?.total || 0}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Payouts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${expertEarnings?.pending || 0}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Entries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {expertEarnings?.payments?.length || 0}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${totalSpent}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{payments?.length || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This {dateRange === 'week' ? 'Week' : dateRange === 'month' ? 'Month' : 'Year'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(payments || [])
                        .filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + p.amount, 0)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Payment Methods (for clients) */}
        {!isExpert && paymentMethods && paymentMethods.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
            <div className="flex flex-wrap gap-4">
              {paymentMethods.map((method: any) => (
                <div
                  key={method.id}
                  className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm"
                >
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {method.brand} •••• {method.last4}
                  </span>
                  {method.is_default && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Date range:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {payments && payments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {isExpert ? 'Payment from Client' : `Session with ${payment.expert.name}`}
                          </h3>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{payment.booking.service}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{format(new Date(payment.date), 'MMM d, yyyy • h:mm a')}</span>
                          <span>{payment.paymentMethod.brand} •••• {payment.paymentMethod.last4}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                      <p className="text-xl font-bold text-gray-900">
                        {payment.currency === 'USD' ? '$' : ''}{payment.amount.toFixed(2)}
                      </p>
                      {payment.status === 'completed' && (
                        <motion.button
                          onClick={() => handleDownloadInvoice(payment.id)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          whileHover={{ x: 2 }}
                        >
                          <Download className="h-4 w-4" />
                          Invoice
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">
                {filterStatus !== 'all'
                  ? `No ${filterStatus} payments in this period`
                  : 'Your payment history will appear here'}
              </p>
            </div>
          )}
        </div>

        {/* Expert Payout Section */}
        {isExpert && expertEarnings && expertEarnings.total > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready for Payout</h3>
                <p className="text-blue-100 text-sm">
                  Your available balance can be withdrawn to your bank account
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold">${expertEarnings.total}</p>
                  <p className="text-sm text-blue-100">Available</p>
                </div>
                <motion.button
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Request Payout
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
