import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { listingsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface WishlistContextValue {
  savedIds: Set<string>;
  loading: boolean;
  toggle: (listingId: string) => Promise<any>;
  isSaved: (listingId: string) => boolean;
  checkStatus: (listingIds: string[]) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
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

  return (
    <WishlistContext.Provider value={{ savedIds, loading, toggle, isSaved, checkStatus }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
};
