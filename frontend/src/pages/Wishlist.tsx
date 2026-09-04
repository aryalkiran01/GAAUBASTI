/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { listingsAPI } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { EmptyState } from "@/components/EmptyState";
import { Heart } from "lucide-react";

const Wishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const res = await listingsAPI.getWishlist();
        if (res.success && res.data?.items) setItems(res.data.items);
        else if (!res.success) setError(res.message || "Failed to load wishlist");
      } catch { setError("Failed to load wishlist"); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const handleToggleSave = (listingId: string, saved: boolean) => {
    if (!saved) {
      setItems((prev) => prev.filter((item) => {
        const id = item.listing?._id || item.listing?.id || item.listing;
        return String(id) !== String(listingId);
      }));
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Saved Listings</h1>
        <p className="mb-6 text-muted-foreground">Please sign in to view your saved listings.</p>
        <Link to="/login"><Button className="bg-gaun-green hover:bg-gaun-light-green">Log in</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <h1 className="mb-6 text-3xl font-serif font-bold">Saved Listings</h1>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved listings yet"
          description="Browse listings and tap the heart icon to save your favorites here."
          action={<Link to="/listings"><Button className="bg-gaun-green hover:bg-gaun-light-green">Browse listings</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const listing = item.listing;
            if (!listing) return null;
            const id = listing._id || listing.id;
            return <ListingCard key={item._id || id} listing={listing} saved={true} onToggleSave={handleToggleSave} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
