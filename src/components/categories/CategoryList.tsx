import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2, Users, Star, Calendar } from 'lucide-react';
import type { Category, CategoryStats } from '../../types/category';

interface CategoryListProps {
  categories: Category[];
  stats: Record<string, CategoryStats>;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryList({ categories, stats, onEdit, onDelete }: CategoryListProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-lg bg-white shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{category.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(category)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(category.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {stats[category.id] && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Total Experts</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats[category.id].totalExperts}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats[category.id].averageRating.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats[category.id].totalBookings}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stats[category.id]?.topExperts && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700">Top Experts</h4>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stats[category.id].topExperts.map((expert) => (
                    <Link
                      key={expert.id}
                      to={`/experts/${expert.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{expert.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{expert.rating}</span>
                          <span>•</span>
                          <span>{expert.bookings} bookings</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {stats[category.id]?.popularServices && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700">Popular Services</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stats[category.id].popularServices.map((service) => (
                    <div
                      key={service.name}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {service.name} ({service.bookings})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}