import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from '../animations/FadeIn';

interface HeroProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCurrentTab: (tab: string) => void;
  categories: string[];
}

export const Hero: React.FC<HeroProps> = ({
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  setCurrentTab,
  categories,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <div className="relative bg-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100"></div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50 to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center mb-16">
          <FadeIn delay={0.2}>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-8">
              Expert Advice<br />
              <span className="text-blue-600">When You Need It Most</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
              Connect with verified professionals for personalized video consultations across various fields.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.6}>
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="bg-white rounded-lg shadow-lg p-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative md:w-1/3">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 text-left bg-white border rounded-lg flex items-center justify-between hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                  >
                    <span className="text-gray-700">{selectedCategory}</span>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg"
                    >
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                        >
                          {category}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by expertise, name, or keyword..."
                      className="w-full px-4 py-3 border rounded-lg pl-12 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    />
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <motion.button 
                  onClick={() => setCurrentTab('experts')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 whitespace-nowrap transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Find Expert
                </motion.button>
              </div>

              <div className="mt-4 px-4">
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>Popular:</span>
                  {['Business Strategy', 'Medical Consultation', 'Financial Planning', 'Career Coaching'].map((term) => (
                    <motion.button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="hover:text-blue-600 transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {term}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>

        <FadeIn delay={0.8}>
          <div className="mt-16 text-center">
            <p className="text-gray-500 mb-6">Trusted by professionals worldwide</p>
            <div className="flex justify-center items-center space-x-12 opacity-75">
              <motion.img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" 
                alt="Microsoft" 
                className="h-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg" 
                alt="Airbnb" 
                className="h-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
              <motion.img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" 
                alt="Google" 
                className="h-7"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};