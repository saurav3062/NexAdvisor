export interface Expert {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  expertise: string;
  hourlyRate: number;
  availability: string;
  bio?: string;
  languages?: string[];
  education?: string[];
  location?: string;
  yearsOfExperience?: number;
  company?: string;
  skills?: string[];
  successRate?: number;
  totalConsultations?: number;
  specializations?: string[];
  certifications?: string[];
  timezone?: string;
  workingHours?: {
    days: string[];
    hours: { start: string; end: string; }[];
  };
  status: 'available' | 'busy' | 'offline';
  lastActive?: string;
  averageResponseTime?: string;
  featured?: boolean;
  verified: boolean;
  sessionDuration?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  expertCount: number;
  icon?: string;
  slug: string;
  featuredExperts?: Expert[];
  subcategories?: Category[];
  parentId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "expert";
  avatar?: string;
  bio?: string;
  expertise?: string[];
  hourlyRate?: number;
  availability?: {
    days: string[];
    hours: { start: string; end: string; }[];
  };
  stats?: {
    totalBookings: number;
    completedBookings: number;
    totalEarnings: number;
    averageRating: number;
  };
  createdAt: string;
}

export interface Booking {
  id: string;
  expertId: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  expert?: Expert;
  client?: User;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  meetingUrl?: string;
  notes?: string;
}

export interface Review {
  id: string;
  expertId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
  response?: {
    text: string;
    date: string;
  };
  booking?: Booking;
}

export interface ExpertAvailability {
  availableSlots: string[];
  timezone: string;
  duration: number;
}

export interface BookingFilters {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  expertId?: string;
  page?: number;
  limit?: number;
}

export interface ExpertFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: 'today' | 'this-week' | 'next-week';
  rating?: number;
  languages?: string[];
  specializations?: string[];
  sortBy?: 'rating' | 'price' | 'experience';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
}