import { useState, useEffect } from 'react';
import { listingsAPI } from '@/lib/api';
import { Listing } from '@/types';
import { dummyListings } from '@/lib/dummy-data';

interface UseListingsParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  rating?: number;
  category?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
}

interface UseListingsReturn {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalListings: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  refetch: () => void;
}

export const useListings = (params: UseListingsParams = {}): UseListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await listingsAPI.getListings(params);
        
        if (response.success) {
          setListings(response.data.listings);
          setPagination(response.data.pagination);
        } else {
          throw new Error(response.message || 'Failed to fetch listings');
        }
      } catch (apiError) {
        console.warn('API not available, using dummy data:', apiError);
        // Fallback to dummy data if API is not available
        setListings(dummyListings);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalListings: dummyListings.length,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching listings');
      // Fallback to dummy data on error
      setListings(dummyListings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [JSON.stringify(params)]);

  return {
    listings,
    loading,
    error,
    pagination,
    refetch: fetchListings
  };
};

export const useFeaturedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const response = await listingsAPI.getFeaturedListings();
          
          if (response.success) {
            setListings(response.data.listings);
          } else {
            throw new Error(response.message || 'Failed to fetch featured listings');
          }
        } catch (apiError) {
          console.warn('API not available, using dummy data:', apiError);
          // Fallback to dummy data if API is not available
          setListings(dummyListings.slice(0, 4));
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching featured listings');
        // Fallback to dummy data on error
        setListings(dummyListings.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  return { listings, loading, error };
};

export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const response = await listingsAPI.getListing(id);
          
          if (response.success) {
            setListing(response.data.listing);
          } else {
            throw new Error(response.message || 'Failed to fetch listing');
          }
        } catch (apiError) {
          console.warn('API not available, using dummy data:', apiError);
          // Fallback to dummy data if API is not available
          const dummyListing = dummyListings.find(l => l.id === id);
          if (dummyListing) {
            setListing(dummyListing);
          } else {
            throw new Error('Listing not found');
          }
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching listing');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  return { listing, loading, error };
};