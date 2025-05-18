import { Expert, User, Booking, Review } from '../types';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const api = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(500);
      if (email === "test@example.com" && password === "password") {
        return {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          role: "client",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
        };
      }
      throw new ApiError(401, "Invalid credentials");
    },

    register: async (data: { 
      name: string; 
      email: string; 
      password: string; 
      role: "client" | "expert" 
    }): Promise<User> => {
      await delay(500);
      return {
        id: "2",
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
      };
    },

    logout: async () => {
      await delay(200);
    }
  },

  // Experts endpoints
  experts: {
    list: async (params?: { 
      category?: string; 
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ experts: Expert[]; total: number }> => {
      await delay(500);
      let experts = [...dummyExperts];
      
      if (params?.category && params.category !== 'All Categories') {
        experts = experts.filter(e => e.category === params.category);
      }
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        experts = experts.filter(e => 
          e.name.toLowerCase().includes(search) ||
          e.expertise.toLowerCase().includes(search) ||
          e.category.toLowerCase().includes(search)
        );
      }

      return {
        experts: experts.slice(0, params?.limit || 10),
        total: experts.length
      };
    },

    get: async (id: string): Promise<Expert> => {
      await delay(300);
      const expert = dummyExperts.find(e => e.id === id);
      if (!expert) throw new ApiError(404, "Expert not found");
      return expert;
    },

    getAvailability: async (expertId: string, date: Date): Promise<string[]> => {
      await delay(300);
      return [
        "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"
      ];
    },

    getReviews: async (expertId: string): Promise<Review[]> => {
      await delay(300);
      return dummyReviews.filter(r => r.expertId === expertId);
    }
  },

  // Bookings endpoints
  bookings: {
    create: async (data: {
      expertId: string;
      date: string;
      time: string;
      duration: number;
    }): Promise<Booking> => {
      await delay(500);
      return {
        id: Math.random().toString(36).substr(2, 9),
        expertId: data.expertId,
        clientId: "1",
        date: data.date,
        time: data.time,
        duration: data.duration,
        status: "pending",
        createdAt: new Date().toISOString()
      };
    },

    list: async (): Promise<Booking[]> => {
      await delay(300);
      return dummyBookings;
    },

    cancel: async (id: string): Promise<void> => {
      await delay(300);
    }
  }
};

// Dummy data
const dummyExperts: Expert[] = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    category: "Medical",
    rating: 4.9,
    reviews: 127,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    expertise: "Cardiology",
    hourlyRate: 150,
    availability: "Next available: Today",
    bio: "Board-certified cardiologist with a passion for preventive cardiology and heart health education. Specialized in complex cardiovascular conditions and lifestyle medicine.",
    languages: ["English", "Mandarin"],
    education: ["MD from Stanford University", "Cardiology Fellowship at Mayo Clinic"],
    location: "San Francisco, CA",
    yearsOfExperience: 15,
    company: "Stanford Medical Center",
    skills: ["Cardiac Imaging", "Preventive Cardiology", "Heart Failure Management", "Interventional Procedures"],
    successRate: 98,
    totalConsultations: 1200,
    specializations: ["Preventive Cardiology", "Women's Heart Health", "Sports Cardiology"],
    certifications: ["American Board of Cardiology", "Advanced Heart Failure"]
  },
  {
    id: "2",
    name: "Michael Roberts",
    category: "Finance",
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    expertise: "Investment Strategy",
    hourlyRate: 200,
    availability: "Next available: Tomorrow",
    bio: "Former Wall Street analyst turned independent advisor. Specializing in portfolio optimization and retirement planning for high-net-worth individuals.",
    languages: ["English"],
    education: ["MBA from Harvard Business School"],
    location: "New York, NY",
    yearsOfExperience: 12,
    company: "Roberts Financial Advisors",
    skills: ["Portfolio Management", "Risk Assessment", "Retirement Planning", "Tax Strategy"],
    successRate: 94,
    totalConsultations: 850,
    specializations: ["Wealth Management", "Estate Planning", "International Markets"],
    certifications: ["Certified Financial Planner (CFP)", "Chartered Financial Analyst (CFA)"]
  },
  {
    id: "3",
    name: "Prof. Emily Watson",
    category: "Academic",
    rating: 5.0,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    expertise: "Research Methodology",
    hourlyRate: 120,
    availability: "Next available: Today",
    bio: "Leading expert in research methodology and academic writing. Helping graduate students and researchers achieve excellence in their academic pursuits.",
    languages: ["English", "French"],
    education: ["PhD in Research Methodology from Oxford University"],
    location: "London, UK",
    yearsOfExperience: 18,
    company: "University of London",
    skills: ["Research Design", "Statistical Analysis", "Academic Writing", "Thesis Development"],
    successRate: 96,
    totalConsultations: 980,
    specializations: ["Qualitative Research", "Mixed Methods", "Academic Publishing"],
    certifications: ["Advanced Research Methods", "Statistical Analysis"]
  },
  {
    id: "4",
    name: "David Kim",
    category: "Technology",
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    expertise: "Software Architecture",
    hourlyRate: 180,
    availability: "Next available: Today",
    bio: "Senior Software Architect with 12 years of experience in building scalable systems. Expert in cloud architecture and distributed systems.",
    languages: ["English", "Korean"],
    education: ["MS in Computer Science from MIT"],
    location: "Seattle, WA",
    yearsOfExperience: 12,
    company: "Tech Solutions Inc.",
    skills: ["Cloud Architecture", "Microservices", "System Design", "DevOps"],
    successRate: 97,
    totalConsultations: 750,
    specializations: ["Cloud Migration", "System Optimization", "Technical Leadership"],
    certifications: ["AWS Solutions Architect", "Google Cloud Professional"]
  }
];

const dummyReviews: Review[] = [
  {
    id: "1",
    expertId: "1",
    clientId: "5",
    clientName: "John Doe",
    rating: 5,
    comment: "Excellent consultation! Dr. Chen was very thorough and explained everything clearly.",
    date: "2024-02-15"
  },
  {
    id: "2",
    expertId: "1",
    clientId: "6",
    clientName: "Alice Smith",
    rating: 4,
    comment: "Very knowledgeable and professional. Would recommend.",
    date: "2024-02-10"
  },
  {
    id: "3",
    expertId: "2",
    clientId: "7",
    clientName: "Robert Johnson",
    rating: 5,
    comment: "Michael provided excellent investment advice. His strategy recommendations were spot-on.",
    date: "2024-02-20"
  },
  {
    id: "4",
    expertId: "3",
    clientId: "8",
    clientName: "Sarah Williams",
    rating: 5,
    comment: "Prof. Watson's guidance on research methodology was invaluable for my thesis.",
    date: "2024-02-18"
  }
];

const dummyBookings: Booking[] = [
  {
    id: "1",
    expertId: "1",
    clientId: "1",
    date: "2024-03-15",
    time: "10:00",
    duration: 60,
    status: "confirmed",
    createdAt: "2024-03-01T10:00:00Z"
  },
  {
    id: "2",
    expertId: "2",
    clientId: "1",
    date: "2024-03-20",
    time: "14:00",
    duration: 30,
    status: "pending",
    createdAt: "2024-03-02T15:00:00Z"
  },
  {
    id: "3",
    expertId: "3",
    clientId: "2",
    date: "2024-03-18",
    time: "11:00",
    duration: 45,
    status: "completed",
    createdAt: "2024-03-01T09:00:00Z"
  }
];