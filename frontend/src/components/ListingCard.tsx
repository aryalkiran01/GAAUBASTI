import { useState } from "react";
import { Link } from "react-router-dom";
import { Listing } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Bed, Bath, Users, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listingsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface ListingCardProps {
  listing: Listing;
  saved?: boolean;
  onToggleSave?: (listingId: string, saved: boolean) => void;
}

export default function ListingCard({ listing, saved: savedProp, onToggleSave }: ListingCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(savedProp || false);
  const [toggling, setToggling] = useState(false);

  const getImageUrl = (images: string[] | Array<{url: string}>) => {
    if (Array.isArray(images) && images.length > 0) {
      return typeof images[0] === 'string' ? images[0] : images[0].url;
    }
    return "https://images.unsplash.com/photo-1587061949409-02df41d5e562";
  };

  const getLocationString = (location: string | {city: string; state?: string; country: string}) => {
    if (typeof location === 'string') return location;
    return `${location.city}${location.state ? `, ${location.state}` : ''}, ${location.country}`;
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ variant: "destructive", title: "Please log in", description: "You need to be logged in to save listings." });
      return;
    }
    if (toggling) return;
    setToggling(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      const res = await listingsAPI.toggleWishlist(listing.id);
      if (!res.success) {
        setSaved(wasSaved);
        toast({ variant: "destructive", title: "Failed to update wishlist", description: res.message || "Please try again." });
        return;
      }
      const nowSaved = res.data?.saved ?? !wasSaved;
      setSaved(nowSaved);
      if (onToggleSave) onToggleSave(listing.id, nowSaved);
    } catch {
      setSaved(wasSaved);
      toast({ variant: "destructive", title: "Failed to update wishlist", description: "Network error. Please try again." });
    } finally {
      setToggling(false);
    }
  };

  return (
    <Link to={`/listing/${listing.id}`} className="block h-full group">
      <Card className="overflow-hidden border-border hover:shadow-lg transition-shadow duration-200 h-full">
        <div className="aspect-[4/3] overflow-hidden relative bg-secondary">
          <img
            src={getImageUrl(listing.images)}
            alt={listing.title}
            className="listing-image h-full w-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/95 text-foreground hover:bg-white/95 shadow-sm border-0">
              <span className="font-semibold">${listing.price}</span>
              <span className="text-muted-foreground font-normal"> / night</span>
            </Badge>
          </div>
          {user && (
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={toggling}
              className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:scale-110 disabled:opacity-50"
              aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </button>
          )}
        </div>
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-semibold text-base md:text-lg leading-tight line-clamp-1">
              {listing.title}
            </h3>
            <div className="flex items-center shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium ml-1">
                {listing.averageRating || listing.rating}
              </span>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="line-clamp-1">{getLocationString(listing.location)}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              <span>{listing.bedrooms} {listing.bedrooms === 1 ? "bed" : "beds"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{listing.maxGuests} guests</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
