import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, User, Calendar, Star, ArrowRight, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useGlobalSearch, SearchResult } from '../../hooks/useGlobalSearch';

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ onResultClick, placeholder = "Search experts, categories...", className = "" }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      if (Array.isArray(saved)) setRecentSearches(saved.filter(x => typeof x === 'string'));
    } catch { /* Storage may be unavailable. */ }
    setHistoryLoaded(true);
  }, []);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);
  const { data: results = [], isLoading } = useGlobalSearch(debouncedQuery);

  useEffect(() => {
    if (historyLoaded) { try { localStorage.setItem('recentSearches', JSON.stringify(recentSearches)); } catch { /* Optional history. */ } }
  }, [recentSearches, historyLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);

    // Add to recent searches
    const searchTerm = result.type === 'expert' ? result.title : result.category || result.title;
    const newRecentSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecentSearches);

    // Navigate based on result type
    if (result.type === 'expert') {
      router.push(`/experts/${result.id}`);
    } else if (result.type === 'category') {
      router.push(`/experts?category=${result.id}`);
    }

    onResultClick?.(result);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    setIsOpen(true);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'expert':
        return User;
      case 'category':
        return Calendar;
      default:
        return Search;
    }
  };

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
          >
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Searches
                  </h4>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length > 0 && results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-gray-500">
                No results found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                {results.map((result) => {
                  const Icon = getResultIcon(result.type);
                  return (
                    <motion.button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.title}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{result.title}</h4>
                          {result.price && (
                            <span className="text-sm font-semibold text-blue-600">
                              ${result.price}/hr
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{result.subtitle}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          {result.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {result.category}
                            </span>
                          )}
                          {result.rating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500 ml-1">{result.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
