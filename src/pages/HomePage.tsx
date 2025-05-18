import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/home/Hero';
import { FeaturedExperts } from '../components/home/FeaturedExperts';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { HowItWorks } from '../components/home/HowItWorks';
import { CTASection } from '../components/home/CTASection';
import { useFeaturedExperts, useExpertCategories } from '../hooks/useExperts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('home');
  const navigate = useNavigate();

  const { 
    data: featuredExperts, 
    isLoading: isLoadingExperts,
    error: expertsError 
  } = useFeaturedExperts();

  const {
    data: categories,
    isLoading: isLoadingCategories
  } = useExpertCategories();

  React.useEffect(() => {
    if (currentTab === 'experts') {
      navigate('/experts');
    }
  }, [currentTab, navigate]);

  const handleSignup = () => {
    navigate('/signup');
  };

  if (isLoadingExperts || isLoadingCategories) {
    return <LoadingSpinner />;
  }

  if (expertsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load experts</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <Hero
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentTab={setCurrentTab}
        categories={Array.isArray(categories) ? categories.map(cat => cat.name) : []}
      />
      <FeaturedExperts experts={featuredExperts || []} />
      <WhyChooseUs />
      <HowItWorks />
      <CTASection onSignup={handleSignup} />
    </div>
  );
}