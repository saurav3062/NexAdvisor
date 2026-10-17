import React from 'react';
import { motion } from 'framer-motion';
import { Download, CreditCard, Calendar, User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  expert: {
    id: string;
    name: string;
    image: string;
  };
  booking: {
    id: string;
    service: string;
    date: string;
  };
  paymentMethod: {
    type: string;
    last4: string;
    brand: string;
  };
}

interface PaymentHistoryProps {
  payments: Payment[];
  onDownloadInvoice: (paymentId: string) => void;
}

export function PaymentHistory({ payments, onDownloadInvoice }: PaymentHistoryProps) {
  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
      </div>

      <div className="divide-y">
        {payments.map((payment, index) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={payment.expert.image}
                  alt={payment.expert.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{payment.expert.name}</p>
                  <p className="text-sm text-gray-500">{payment.booking.service}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {payment.currency} {payment.amount}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(payment.date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>
                  {payment.paymentMethod.brand} ****{payment.paymentMethod.last4}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <motion.button
                onClick={() => onDownloadInvoice(payment.id)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}