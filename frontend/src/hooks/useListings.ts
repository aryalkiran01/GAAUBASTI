import { useState, useEffect } from "react";
import { listingsAPI } from "@/lib/api";
import { Listing } from "@/types";

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

export const useListings = (
  params: UseListingsParams = {}
): UseListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listingsAPI.getListings(params);

      if (response.success) {
        setListings(response.data.listings);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "Failed to fetch listings");
        setListings([]);
        setPagination(null);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching listings");
      setListings([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return {
    listings,
    loading,
    error,
    pagination,
    refetch: fetchListings,
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

        const response = await listingsAPI.getFeaturedListings();

        if (response.success) {
          setListings(response.data.listings);
        } else {
          setError(
            response.message || "Failed to fetch featured listings"
          );
          setListings([]);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(
          err.message || "An error occurred while fetching featured listings"
        );
        setListings([]);
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

        const response = await listingsAPI.getListing(id);

        if (response.success) {
          setListing(response.data.listing);
        } else {
          setError(response.message || "Failed to fetch listing");
          setListing(null);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching listing");
        setListing(null);
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
