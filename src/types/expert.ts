export interface ExpertSkill {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'expert';
  yearsOfExperience: number;
  description?: string;
  endorsements?: number;
}

export interface ExpertCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
}

export interface ExpertEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
  achievements?: string[];
}

export interface ExpertAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bufferTime: number;
  maxBookingsPerDay?: number;
  breakTimes?: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface ExpertService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  isActive: boolean;
  maxParticipants?: number;
  prerequisites?: string[];
  category: string;
}

export interface Expert {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage: string;
  coverImage?: string;
  title: string;
  bio: string;
  shortBio: string;
  expertise: string[];
  languages: Array<{
    language: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }>;
  location: {
    country: string;
    city?: string;
    timezone: string;
  };
  skills: ExpertSkill[];
  certifications: ExpertCertification[];
  education: ExpertEducation[];
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    highlights?: string[];
  }>;
  availability: ExpertAvailability[];
  services: ExpertService[];
  settings: {
    bufferTime: number;
    autoAcceptBookings: boolean;
    notificationPreferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    cancellationPolicy: {
      minimumNotice: number;
      refundPercentage: number;
    };
  };
  stats: {
    rating: number;
    totalReviews: number;
    totalSessions: number;
    completionRate: number;
    responseRate: number;
    averageResponseTime: number;
  };
  status: 'active' | 'away' | 'busy' | 'offline';
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertFilter {
  categories?: string[];
  expertise?: string[];
  languages?: string[];
  availability?: {
    dayOfWeek?: number[];
    timeRange?: {
      start: string;
      end: string;
    };
  };
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  location?: {
    countries?: string[];
    timezone?: string;
  };
  skills?: string[];
  sortBy?: 'rating' | 'price' | 'experience' | 'availability';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}