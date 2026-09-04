/* eslint-disable @typescript-eslint/no-explicit-any */

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
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

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export interface PaymentDetails {
  bookingId?: string;
  listingId: string;
  amount: number;
  nights: number;
  startDate?: Date;
  status: PaymentStatus;
  currency?: string;
}

// Adding a new type for dialogs
export type DialogType = 'user' | 'listing' | 'booking' | null;

export interface Review {
  id: string;
  listing: string | Listing;
  guest: string | User;
  booking: string;
  rating: number;
  comment: string;
  ratings?: {
    cleanliness?: number;
    communication?: number;
    checkIn?: number;
    accuracy?: number;
    location?: number;
    value?: number;
  };
  createdAt: string;
  hostResponse?: {
    comment: string;
    respondedAt: string;
  };
}

export interface Conversation {
  _id?: string;
  id?: string;
  participants: Array<User & { _id?: string }>;
  listing?: string | Listing;
  booking?: string;
  lastMessageAt?: string | Date;
  unreadCount?: Record<string, number>;
}

export interface Message {
  _id?: string;
  id?: string;
  conversation?: string;
  sender?: User & { _id?: string };
  body?: string;
  attachments?: string[];
  readBy?: string[];
  systemType?: string | null;
  createdAt?: string;
}

export interface NotificationItem {
  _id?: string;
  id?: string;
  user?: string;
  type?: string;
  content?: Record<string, any>;
  read?: boolean;
  createdAt?: string;
}