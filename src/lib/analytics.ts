import { Expert, Booking } from '../types';

// Initialize analytics
export const initAnalytics = () => {
  // Initialize analytics tracking
  if (typeof window !== 'undefined') {
    // Add your analytics initialization code here
    console.log('Analytics initialized');
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined') {
    // Track page view
    console.log('Page view:', path);
  }
};

// Track user actions
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined') {
    // Track custom event
    console.log('Event:', { category, action, label, value });
  }
};

// Track expert profile views
export const trackExpertView = (expert: Expert) => {
  trackEvent('Expert', 'View Profile', expert.name);
};

// Track booking events
export const trackBooking = (booking: Booking) => {
  trackEvent('Booking', 'Create', booking.expertId, booking.totalAmount);
};

// Track search events
export const trackSearch = (query: string, results: number) => {
  trackEvent('Search', 'Execute', query, results);
};

// Track user engagement
export const trackEngagement = (action: string, duration: number) => {
  trackEvent('Engagement', action, undefined, duration);
};

// Track errors
export const trackError = (error: Error, context?: string) => {
  trackEvent('Error', error.name, `${context}: ${error.message}`);
};

// Track performance metrics
export const trackPerformance = (metric: string, value: number) => {
  trackEvent('Performance', metric, undefined, value);
};

// Track feature usage
export const trackFeatureUsage = (feature: string, action: string) => {
  trackEvent('Feature', action, feature);
};

// Track conversion events
export const trackConversion = (type: string, value: number) => {
  trackEvent('Conversion', type, undefined, value);
};

// Track user preferences
export const trackPreference = (category: string, value: string) => {
  trackEvent('Preference', category, value);
};

// Track social interactions
export const trackSocialInteraction = (
  network: string,
  action: string,
  target?: string
) => {
  trackEvent('Social', action, `${network}:${target}`);
};