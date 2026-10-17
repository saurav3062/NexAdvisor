import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface FloatingBookButtonProps {
  onClick: () => void;
}

export const FloatingBookButton: React.FC<FloatingBookButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Calendar className="h-5 w-5" />
      <span className="font-medium">Book Now</span>
    </motion.button>
  );
};