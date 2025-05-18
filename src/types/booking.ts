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

export interface BookingParticipant {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'host' | 'attendee';
  joinedAt?: string;
  leftAt?: string;
}

export interface BookingDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BookingNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  private: boolean;
}

export interface Booking {
  id: string;
  expertId: string;
  clientId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
  startTime: string;
  endTime: string;
  duration: number;
  timeZone: string;
  location: {
    type: 'online' | 'in-person';
    details: string;
  };
  participants: BookingParticipant[];
  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    transactionId?: string;
  };
  cancellation?: {
    reason: string;
    cancelledBy: string;
    cancelledAt: string;
    refundAmount?: number;
  };
  rescheduling?: {
    requestedBy: string;
    requestedAt: string;
    originalStartTime: string;
    originalEndTime: string;
  };
  meetingDetails?: {
    platform: string;
    joinUrl: string;
    password?: string;
    additionalInfo?: string;
  };
  documents: BookingDocument[];
  notes: BookingNote[];
  feedback?: {
    rating: number;
    review?: string;
    createdAt: string;
  };
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilter {
  status?: Booking['status'][];
  dateRange?: {
    start: string;
    end: string;
  };
  expertId?: string;
  clientId?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'status' | 'price';
  sortOrder?: 'asc' | 'desc';
}