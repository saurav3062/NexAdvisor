'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X, Star, Grid2x2 as Grid, List, ChevronDown, MapPin, SlidersHorizontal, BadgeCheck, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '../components/animations/FadeIn';
import { ExpertCard } from '../components/experts/ExpertCard';
import { expertService, categoryService } from '../services/supabaseApi';
import { useDebounce } from '../hooks/useDebounce';
import { SEO } from '../components/seo/SEO';
import { Expert, Category } from '../types';

// Skeleton component for loading states
function ExpertCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-12" />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="h-12 bg-gray-100 rounded-lg" />
          <div className="h-12 bg-gray-100 rounded-lg" />
          <div className="h-12 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-lg flex-1" />
          <div className="h-10 bg-gray-200 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ExpertsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useMemo(() => new URLSearchParams(params.toString()), [params]);
  const setSearchParams = useCallback((next: URLSearchParams) => {
    router.replace(pathname + (next.size ? '?' + next.toString() : ''), { scroll: false });
  }, [router, pathname]);
  const categoryFromUrl = searchParams.get('category');

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryFromUrl);
  const [selectedCategoryName, setSelectedCategoryName] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 500,
    rating: 0,
    sortBy: 'rating' as 'rating' | 'price' | 'experience',
    availability: 'any' as 'any' | 'today' | 'week'
  });

  // Calculate active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 500) count++;
    if (filters.rating > 0) count++;
    if (filters.availability !== 'any') count++;
    return count;
  }, [selectedCategoryId, filters]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle URL category param on initial load and when categories are loaded
  useEffect(() => {
    if (categoryFromUrl && categories.length > 0) {
      const category = categories.find(c => c.id === categoryFromUrl);
      if (category) {
        setSelectedCategoryId(categoryFromUrl);
        setSelectedCategoryName(category.name);
      }
    }
  }, [categoryFromUrl, categories]);

  useEffect(() => {
    setPage(1);
    loadExperts(true);
  }, [selectedCategoryId, debouncedSearch, filters]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.list();
      setCategories(data);

      if (categoryFromUrl) {
        const category = data.find((c: any) => c.id === categoryFromUrl);
        if (category) {
          setSelectedCategoryName(category.name);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCategoryChange = useCallback((categoryName: string) => {
    if (categoryName === 'All Categories') {
      setSelectedCategoryId(null);
      setSelectedCategoryName('All Categories');
      searchParams.delete('category');
    } else {
      const category = categories.find(c => c.name === categoryName);
      if (category) {
        setSelectedCategoryId(category.id);
        setSelectedCategoryName(categoryName);
        searchParams.set('category', category.id);
      }
    }
    setSearchParams(searchParams);
    setPage(1);
  }, [categories, searchParams, setSearchParams]);

  const loadExperts = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await expertService.list({
        category: selectedCategoryId || undefined,
        search: debouncedSearch || undefined,
        minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice < 500 ? filters.maxPrice : undefined,
        rating: filters.rating > 0 ? filters.rating : undefined,
        sortBy: filters.sortBy,
        ascending: filters.sortBy === 'price',
        limit: 20,
        offset: reset ? 0 : (page - 1) * 20
      });

      const transformedExperts: Expert[] = data.map((e: any) => ({
        id: e.id,
        name: e.name || e.user?.name || '',
        image: e.image || e.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.user?.name || 'Expert')}&background=3b82f6&color=fff&size=200`,
        expertise: e.title || '',
        category: e.category?.name || 'General',
        categoryId: e.category_id,
        rating: e.rating || 0,
        reviews: e.total_reviews || 0,
        hourlyRate: e.hourly_rate || 0,
        location: e.location || e.user?.location || 'Remote',
        availability: e.status === 'active' ? 'Available' : 'Limited',
        totalConsultations: e.total_consultations || 0,
        yearsOfExperience: e.years_of_experience || 0,
        skills: e.skills?.map((s: any) => s.name) || [],
        certifications: e.certifications?.map((c: any) => c.name) || [],
        successRate: e.success_rate || 95,
        bio: e.bio || '',
        services: e.services || [],
        languages: e.languages?.map((l: any) => l.language || l.name) || [],
        verified: e.verified || false
      }));

      if (reset) {
        setExperts(transformedExperts);
      } else {
        setExperts(prev => [...prev, ...transformedExperts]);
      }

      setHasMore(transformedExperts.length === 20);
    } catch (error) {
      console.error('Failed to load experts:', error);
      if (reset) setExperts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreExperts = () => {
    setPage(prev => prev + 1);
    loadExperts(false);
  };

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setSelectedCategoryName('All Categories');
    searchParams.delete('category');
    setSearchParams(searchParams);
    setSearchQuery('');
    setFilters({
      minPrice: 0,
      maxPrice: 500,
      rating: 0,
      sortBy: 'rating',
      availability: 'any'
    });
  };

  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'category':
        setSelectedCategoryId(null);
        setSelectedCategoryName('All Categories');
        searchParams.delete('category');
        setSearchParams(searchParams);
        break;
      case 'price':
        setFilters({ ...filters, minPrice: 0, maxPrice: 500 });
        break;
      case 'rating':
        setFilters({ ...filters, rating: 0 });
        break;
      case 'availability':
        setFilters({ ...filters, availability: 'any' });
        break;
    }
  };

  // Filter chips to show active filters
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (selectedCategoryId && selectedCategoryName !== 'All Categories') {
      chips.push({ key: 'category', label: selectedCategoryName });
    }
    if (filters.minPrice > 0 || filters.maxPrice < 500) {
      chips.push({ key: 'price', label: `$${filters.minPrice}-${filters.maxPrice}/hr` });
    }
    if (filters.rating > 0) {
      chips.push({ key: 'rating', label: `${filters.rating}+ stars` });
    }
    if (filters.availability !== 'any') {
      chips.push({ key: 'availability', label: filters.availability === 'today' ? 'Available today' : 'This week' });
    }
    return chips;
  }, [selectedCategoryId, selectedCategoryName, filters]);

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated', icon: Star },
    { value: 'experience', label: 'Most Experienced', icon: TrendingUp },
    { value: 'price', label: 'Price: Low to High', icon: DollarSign }
  ];

  return (
    <>
      <SEO
        title="Find Expert Consultants"
        description="Browse and book consultations with verified experts across medical, finance, legal, technology, and more."
        keywords={['experts', 'consultants', 'advice', 'booking', 'professional']}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-12 lg:py-16">
            <FadeIn>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Find Your Expert
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-2xl">
                Connect with verified professionals. Get personalized advice from experts who've been there.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, skill, or expertise..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Category Pills */}
              <div className="flex flex-wrap gap-2 mt-6">
                <button
                  onClick={() => handleCategoryChange('All Categories')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !selectedCategoryId
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  All Categories
                </button>
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategoryId === cat.id
                        ? 'bg-white text-blue-700 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                {categories.length > 5 && (
                  <select
                    value={selectedCategoryId || ''}
                    onChange={(e) => {
                      const cat = categories.find(c => c.id === e.target.value);
                      handleCategoryChange(cat?.name || 'All Categories');
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white hover:bg-white/30 appearance-none cursor-pointer pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em' }}
                  >
                    <option value="" className="text-gray-700">More...</option>
                    {categories.slice(5).map((cat) => (
                      <option key={cat.id} value={cat.id} className="text-gray-700">{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-6">
          {/* Active Filter Chips & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Active Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.length > 0 && (
                <>
                  {activeFilterChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {chip.label}
                      <button
                        onClick={() => removeFilter(chip.key)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </>
              )}
              {!loading && (
                <span className="text-sm text-gray-500">
                  {experts.length} expert{experts.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="Grid view"
                >
                  <Grid className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  title="List view"
                >
                  <List className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Hourly Rate
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">$0</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="25"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value), minPrice: Math.min(filters.minPrice, Number(e.target.value)) })}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-gray-500 text-sm">$500</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">${filters.minPrice}</span>
                      <span className="text-gray-400">to</span>
                      <span className="font-medium text-gray-900">${filters.maxPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Minimum Rating
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 0, label: 'Any' },
                      { value: 4, label: '4+' },
                      { value: 4.5, label: '4.5+' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters({ ...filters, rating: opt.value })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          filters.rating === opt.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {opt.value > 0 ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {opt.label}
                          </span>
                        ) : opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Availability
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'any', label: 'Any time', desc: '' },
                      { value: 'today', label: 'Available today', desc: 'Book same-day sessions' },
                      { value: 'week', label: 'This week', desc: 'Within 7 days' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters({ ...filters, availability: opt.value as any })}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          filters.availability === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium text-gray-900">{opt.label}</span>
                        {opt.desc && (
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Category
                  </label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleCategoryChange('All Categories')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !selectedCategoryId
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategoryId === cat.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Grid */}
            <main className="flex-1">
              {loading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5' : 'grid-cols-1'}`}>
                  {[...Array(6)].map((_, i) => (
                    <ExpertCardSkeleton key={i} />
                  ))}
                </div>
              ) : experts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-2xl"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No experts found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5' : 'grid-cols-1'}`}>
                    <AnimatePresence mode="popLayout">
                      {experts.map((expert, index) => (
                        <motion.div
                          key={expert.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                        >
                          <ExpertCard expert={expert} variant={viewMode} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center mt-10">
                      <button
                        onClick={loadMoreExperts}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all"
                      >
                        {loadingMore ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          'Load more experts'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        {/* Mobile Filter Modal */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed right-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto lg:hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Hourly Rate
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">$0</span>
                        <input
                          type="range"
                          min="0"
                          max="500"
                          step="25"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="text-gray-500 text-sm">$500</span>
                      </div>
                      <p className="text-sm text-center text-gray-600">
                        Up to <span className="font-semibold">${filters.maxPrice}</span>/hour
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Minimum Rating
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 0, label: 'Any' },
                        { value: 4, label: '4+' },
                        { value: 4.5, label: '4.5+' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilters({ ...filters, rating: opt.value })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            filters.rating === opt.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {opt.value > 0 ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {opt.label}
                            </span>
                          ) : opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Availability
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'any', label: 'Any time' },
                        { value: 'today', label: 'Available today' },
                        { value: 'week', label: 'This week' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilters({ ...filters, availability: opt.value as any })}
                          className={`w-full p-3 rounded-lg border text-left ${
                            filters.availability === opt.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
