import { useState, useEffect } from 'react';
import { bookingsAPI } from '@/lib/api';
import { Booking } from '@/types';
import { dummyBookings } from '@/lib/dummy-data';

interface UseBookingsParams {
  status?: string;
  page?: number;
  limit?: number;
}

interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBookings: number;
  } | null;
  refetch: () => void;
}

export const useUserBookings = (params: UseBookingsParams = {}): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await bookingsAPI.getUserBookings(params);
        
        if (response.success) {
          setBookings(response.data.bookings);
          setPagination(response.data.pagination);
        } else {
          throw new Error(response.message || 'Failed to fetch bookings');
        }
      } catch (apiError) {
        console.warn('API not available, using dummy data:', apiError);
        // Fallback to dummy data if API is not available
        setBookings(dummyBookings);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalBookings: dummyBookings.length
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching bookings');
      // Fallback to dummy data on error
      setBookings(dummyBookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [JSON.stringify(params)]);

  return {
    bookings,
    loading,
    error,
    pagination,
    refetch: fetchBookings
  };
};

export const useHostBookings = (params: UseBookingsParams = {}): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookingsAPI.getHostBookings(params);
      
      if (response.success) {
        setBookings(response.data.bookings);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [JSON.stringify(params)]);

  return {
    bookings,
    loading,
    error,
    pagination,
    refetch: fetchBookings
  };
};

export const useBooking = (id: string) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await bookingsAPI.getBooking(id);
        
        if (response.success) {
          setBooking(response.data.booking);
        } else {
          setError(response.message || 'Failed to fetch booking');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching booking');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  return { booking, loading, error };
};