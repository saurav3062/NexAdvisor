export interface CategoryAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  options?: string[];
  required: boolean;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  parentId?: string;
  attributes: CategoryAttribute[];
  metadata: Record<string, any>;
  settings: {
    allowCustomAttributes: boolean;
    requireVerification: boolean;
    minimumExperience?: number;
    requiredCertifications?: string[];
    customFields?: CategoryAttribute[];
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CategoryStats {
  totalExperts: number;
  averageRating: number;
  totalBookings: number;
  popularServices: Array<{
    name: string;
    bookings: number;
  }>;
  topExperts: Array<{
    id: string;
    name: string;
    rating: number;
    bookings: number;
  }>;
}