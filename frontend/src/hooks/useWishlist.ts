import { useState, useEffect, useCallback } from "react";
import { listingsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const useWishlist = () => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(
    async (listingIds: string[]) => {
      if (!user || listingIds.length === 0) return;
      try {
        const response = await listingsAPI.checkWishlistStatus(listingIds);
        if (response.success && response.data?.savedIds) {
          setSavedIds(new Set(response.data.savedIds));
        }
      } catch {
        // silently ignore
      }
    },
    [user],
  );

  const toggle = useCallback(
    async (listingId: string) => {
      if (!user) return { success: false, message: "Authentication required" };

      setLoading(true);
      try {
        const response = await listingsAPI.toggleWishlist(listingId);
        if (response.success) {
          setSavedIds((prev) => {
            const next = new Set(prev);
            if (response.data?.saved) {
              next.add(listingId);
            } else {
              next.delete(listingId);
            }
            return next;
          });
        }
        return response;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const isSaved = useCallback(
    (listingId: string) => savedIds.has(listingId),
    [savedIds],
  );

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
    }
  }, [user]);

  return { savedIds, loading, toggle, isSaved, checkStatus };
};
