import React from 'react';
import { CategoriesGrid } from '../components/categories/CategoriesGrid';
import { categories } from '../data/categories';

export function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Browse Categories
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore our diverse range of expert categories and find the perfect consultant for your needs
        </p>
      </div>

      <CategoriesGrid categories={categories} />
    </div>
  );
}