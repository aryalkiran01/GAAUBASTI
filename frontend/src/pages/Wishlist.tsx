import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listingsAPI } from "@/lib/api";
import { Listing } from "@/types";
import ListingCard from "@/components/ListingCard";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Heart, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Wishlist = () => {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listingsAPI.getWishlist();
      if (response.success) {
        const listings = (response.data.items || [])
          .map((item: any) => item.listing)
          .filter((listing: any) => listing && listing._id);
        setItems(listings);
      } else {
        setError(response.message || "Failed to load wishlist");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (listingId: string) => {
    const response = await listingsAPI.removeWishlistItem(listingId);
    if (response.success) {
      setItems((prev) => prev.filter((item) => (item as any)._id !== listingId));
      toast({ title: "Removed from wishlist" });
    } else {
      toast({
        title: "Failed to remove",
        description: response.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-12">
      <SEO title="Saved Listings" description="Your favorite homestays and stays." canonicalPath="/wishlist" />
      <div className="container">
        <h1 className="text-3xl font-serif font-bold mb-2">Saved Listings</h1>
        <p className="text-muted-foreground mb-8">
          {items.length > 0 ? `${items.length} ${items.length === 1 ? "stay" : "stays"} you've saved` : "Your favorite stays in one place"}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Heart} title="Error loading wishlist" description={error} />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((listing: any) => (
              <div key={listing._id} className="relative h-full">
                <ListingCard listing={{ ...listing, id: listing._id }} />
                <button
                  onClick={() => handleRemove(listing._id)}
                  aria-label="Remove from wishlist"
                  className="absolute bottom-4 right-4 z-10 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No saved listings yet"
            description="Click the heart icon on any listing to save it here for later."
            action={
              <Link to="/listings">
                <Button className="bg-gaun-green hover:bg-gaun-light-green">
                  Browse listings
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Wishlist;
