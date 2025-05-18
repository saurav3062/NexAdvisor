import React from 'react';

interface CategoriesGridProps {
  categories: string[];
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({ categories }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.slice(1).map((category, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{category}</h3>
            <p className="text-gray-600 mb-4">Find expert consultants in {category.toLowerCase()} and get professional advice.</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Explore {category} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};