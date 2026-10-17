import React from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn } from "../animations/FadeIn";

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
  return (
    <div className="responsive-hero relative bg-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100"></div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50 to-transparent"></div>
      </div>

      <div className="responsive-shell max-w-7xl 2xl:max-w-[1490px] 3xl:max-w-[1860px] 4xl:max-w-[2460px] 5xl:max-w-[3080px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-14 sm:py-20 2xl:py-24 3xl:py-40 relative z-10">
        <div className="text-center mb-10 sm:mb-14 2xl:mb-20 3xl:mb-24">
          <FadeIn delay={0.2}>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl 2xl:text-7xl 3xl:text-8xl mb-8 3xl:mb-12">
              Expert Advice
              <br />
              <span className="text-blue-600">When You Need It Most</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p className="mt-4 text-xl 2xl:text-2xl 3xl:text-3xl text-gray-500 max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl mx-auto">
              Connect with approved experts for personalized consultations
              across various fields.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.6}>
          <div className="max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl mx-auto">
            <motion.div
              className="bg-white rounded-lg border border-gray-100 shadow-lg p-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCurrentTab("experts");
                }}
                className="flex flex-col md:flex-row gap-4 3xl:gap-6"
              >
                <div className="relative md:w-1/3">
                  <select
                    aria-label="Choose category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 text-gray-700 bg-white border rounded-lg focus:border-blue-500"
                  >
                    <option value="All Categories">All Categories</option>
                    {categories
                      .filter((c) => c !== "All Categories")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="search"
                      aria-label="Search experts"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by expertise, name, or keyword..."
                      className="w-full px-4 py-3 3xl:py-4 3xl:pl-14 3xl:text-lg border rounded-lg pl-12 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    />
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 3xl:px-12 3xl:py-4 3xl:text-lg rounded-lg hover:bg-blue-700 whitespace-nowrap transition-colors duration-200 font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Find Expert
                </motion.button>
              </form>

              <div className="mt-4 px-4">
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>Popular:</span>
                  {[
                    "Business Strategy",
                    "Software Architecture",
                    "Financial Planning",
                    "Career Coaching",
                  ].map((term) => (
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
          <div className="mt-16 2xl:mt-20 3xl:mt-28 text-center">
            <p className="text-gray-500 2xl:text-lg 3xl:text-xl mb-6 3xl:mb-10">
              Explore business, technology, finance, career, and academic advice
            </p>
            <p className="text-sm text-gray-500">
              Demo consultations use simulated payments. No real money is
              charged.
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
