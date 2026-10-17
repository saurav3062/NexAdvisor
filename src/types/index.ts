export interface User {
  emailVerified?: boolean;
  id: string;
  name: string;
  email: string;
  role: "client" | "expert" | "admin";
  avatar?: string;
  location?: string;
  website?: string;
  bio?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expert {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  rating: number;
  reviews: number;
  image: string;
  expertise: string;
  hourlyRate: number;
  availability: string;
  bio: string;
  shortBio?: string;
  languages?: string[];
  education?: any[];
  location?: string;
  yearsOfExperience: number;
  company?: string;
  skills?: string[];
  successRate?: number;
  totalConsultations: number;
  specializations?: string[];
  certifications?: string[];
  services?: ExpertService[];
  sessionDuration?: number;
  verified?: boolean;
  featured?: boolean;
}

export interface ExpertService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  maxParticipants?: number;
}

export interface Booking {
  id: string;
  expertId: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  totalAmount?: number;
  expert?: {
    id: string;
    name: string;
    image: string;
    expertise: string;
  };
}

export interface Review {
  id: string;
  expertId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
  expertCount?: number;
  averagePrice?: number;
  subcategories?: string[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  price: number;
  currency: string;
  bufferTimeStart: number;
  bufferTimeEnd: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}
