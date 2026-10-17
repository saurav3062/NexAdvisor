// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPDATE_AVATAR: '/users/avatar',
    CHANGE_PASSWORD: '/users/change-password',
    DELETE_ACCOUNT: '/users/delete',
  },
  
  // Experts
  EXPERTS: {
    LIST: '/experts',
    GET: '/experts/:id',
    CREATE: '/experts',
    UPDATE: '/experts/:id',
    DELETE: '/experts/:id',
    AVAILABILITY: '/experts/:id/availability',
    REVIEWS: '/experts/:id/reviews',
    STATS: '/experts/:id/stats',
    FEATURED: '/experts/featured',
    CATEGORIES: '/experts/categories',
  },
  
  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    GET: '/bookings/:id',
    CREATE: '/bookings',
    UPDATE: '/bookings/:id',
    CANCEL: '/bookings/:id/cancel',
    RESCHEDULE: '/bookings/:id/reschedule',
    CONFIRM: '/bookings/:id/confirm',
    COMPLETE: '/bookings/:id/complete',
  },
  
  // Payments
  PAYMENTS: {
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM: '/payments/confirm',
    REFUND: '/payments/:id/refund',
    HISTORY: '/payments/history',
    INVOICE: '/payments/:id/invoice',
  },
  
  // Reviews
  REVIEWS: {
    CREATE: '/reviews',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
    LIST: '/reviews',
  },
  
  // Categories
  CATEGORIES: {
    LIST: '/categories',
    GET: '/categories/:id',
    CREATE: '/categories',
    UPDATE: '/categories/:id',
    DELETE: '/categories/:id',
    EXPERTS: '/categories/:id/experts',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: '/notifications/:id',
  },
  
  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: '/chat/conversations/:id/messages',
    SEND_MESSAGE: '/chat/conversations/:id/messages',
  },
  
  // File Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    DOCUMENT: '/upload/document',
    AVATAR: '/upload/avatar',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    EXPERTS: '/admin/experts',
    BOOKINGS: '/admin/bookings',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
  },
};

// Application Constants
export const APP_CONFIG = {
  NAME: 'NexAdvisor',
  VERSION: '1.0.0',
  DESCRIPTION: 'Expert consultation platform',
  SUPPORT_EMAIL: 'support@nexadvisor.com',
  COMPANY_NAME: 'NexAdvisor Inc.',
};

// Booking Constants
export const BOOKING_CONFIG = {
  MIN_DURATION: 30, // minutes
  MAX_DURATION: 240, // minutes
  DEFAULT_DURATION: 60, // minutes
  MIN_ADVANCE_BOOKING: 2, // hours
  MAX_ADVANCE_BOOKING: 90, // days
  CANCELLATION_WINDOW: 24, // hours
  BUFFER_TIME_OPTIONS: [5, 10, 15, 30], // minutes
};

// Payment Constants
export const PAYMENT_CONFIG = {
  CURRENCY: 'USD',
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 10000,
  PLATFORM_FEE_PERCENTAGE: 10,
  REFUND_WINDOW: 24, // hours
};

// File Upload Constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILES_PER_UPLOAD: 5,
};

// Validation Constants
export const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 1000,
  REVIEW_MAX_LENGTH: 500,
  SKILLS_MAX_COUNT: 20,
  LANGUAGES_MAX_COUNT: 10,
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_VIDEO_CALLS: process.env.NEXT_PUBLIC_ENABLE_VIDEO_CALLS === 'true',
  ENABLE_CHAT: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_SOCIAL_LOGIN: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true',
};

// Time Zones
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

// Categories
export const EXPERT_CATEGORIES = [
  { id: 'medical', name: 'Medical', icon: '🏥', color: '#ef4444' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#22c55e' },
  { id: 'legal', name: 'Legal', icon: '⚖️', color: '#3b82f6' },
  { id: 'technology', name: 'Technology', icon: '💻', color: '#8b5cf6' },
  { id: 'business', name: 'Business', icon: '📊', color: '#f59e0b' },
  { id: 'academic', name: 'Academic', icon: '🎓', color: '#06b6d4' },
  { id: 'career', name: 'Career', icon: '🚀', color: '#ec4899' },
  { id: 'health', name: 'Health & Wellness', icon: '🌿', color: '#84cc16' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#f97316' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#6366f1' },
];

// Status Options
export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'in-progress', label: 'In Progress', color: 'purple' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'orange' },
];

export const EXPERT_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'away', label: 'Away', color: 'yellow' },
  { value: 'busy', label: 'Busy', color: 'red' },
  { value: 'offline', label: 'Offline', color: 'gray' },
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  BOOKING_CONFLICT: 'This time slot is no longer available.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  BOOKING_CREATED: 'Booking created successfully!',
  BOOKING_CANCELLED: 'Booking cancelled successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PAYMENT_SUCCESS: 'Payment processed successfully.',
  REVIEW_SUBMITTED: 'Review submitted successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
};