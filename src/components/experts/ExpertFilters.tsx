import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, Star, Globe, DollarSign, X } from 'lucide-react';
import Select from 'react-select';

interface ExpertFiltersProps {
  filters: {
    priceRange: { min: number; max: number };
    rating: number;
    availability: string;
    languages: string[];
    specializations: string[];
    location: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function ExpertFilters({ filters, onFilterChange, onClearFilters }: ExpertFiltersProps) {
  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' },
  ];

  const specializationOptions = [
    { value: 'medical', label: 'Medical' },
    { value: 'legal', label: 'Legal' },
    { value: 'financial', label: 'Financial' },
    { value: 'technical', label: 'Technical' },
    { value: 'academic', label: 'Academic' },
    { value: 'business', label: 'Business' },
  ];

  const availabilityOptions = [
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'next-week', label: 'Next Week' },
    { value: 'custom', label: 'Custom Date' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (per hour)
          </label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => onFilterChange({
                  ...filters,
                  priceRange: { ...filters.priceRange, min: parseInt(e.target.value) }
                })}
                className="pl-9 pr-3 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Min"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => onFilterChange({
                  ...filters,
                  priceRange: { ...filters.priceRange, max: parseInt(e.target.value) }
                })}
                className="pl-9 pr-3 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <motion.button
                key={rating}
                onClick={() => onFilterChange({ ...filters, rating })}
                className={`p-2 rounded-md ${
                  filters.rating === rating
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Star
                  className={`h-5 w-5 ${
                    filters.rating === rating ? 'fill-current' : ''
                  }`}
                />
              </motion.button>
            ))}
            <span className="text-sm text-gray-600 ml-2">& up</span>
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability
          </label>
          <Select
            value={availabilityOptions.find(opt => opt.value === filters.availability)}
            onChange={(option) => onFilterChange({
              ...filters,
              availability: option?.value
            })}
            options={availabilityOptions}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages
          </label>
          <Select
            isMulti
            value={languageOptions.filter(opt => filters.languages.includes(opt.value))}
            onChange={(options) => onFilterChange({
              ...filters,
              languages: options.map(opt => opt.value)
            })}
            options={languageOptions}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specializations
          </label>
          <Select
            isMulti
            value={specializationOptions.filter(opt => filters.specializations.includes(opt.value))}
            onChange={(options) => onFilterChange({
              ...filters,
              specializations: options.map(opt => opt.value)
            })}
            options={specializationOptions}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => onFilterChange({
                ...filters,
                location: e.target.value
              })}
              className="pl-9 pr-3 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location"
            />
          </div>
        </div>
      </div>
    </div>
  );
}