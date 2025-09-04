
export type UserRole = 'guest' | 'host' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string | {
    address: string;
    city: string;
    state?: string;
    country: string;
  };
  price: number;
  rating: number;
  reviewCount: number;
  images: string[] | Array<{
    url: string;
    publicId?: string;
    caption?: string;
  }>;
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  hostId: string;
  host?: User;
  category?: string;
  isActive?: boolean;
  isVerified?: boolean;
  averageRating?: number;
}

export interface Booking {
  id: string;
  listing: string | Listing;
  guest: string | User;
  host: string | User;
  startDate: Date | string;
  endDate: Date | string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  guests?: {
    adults: number;
    children: number;
  };
  priceBreakdown?: {
    basePrice: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
  };
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentDetails {
  bookingId?: string;
  listingId: string;
  amount: number;
  nights: number;
  startDate?: Date;
  status: PaymentStatus;
}

// Adding a new type for dialogs
export type DialogType = 'user' | 'listing' | 'booking' | null;
