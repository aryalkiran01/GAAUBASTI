import { Link } from "react-router-dom";
import { useState } from "react";
import { Listing } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Bed, Bath, Users, Heart } from "lucide-react";
import { listingsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast({ title: "Login required", description: "Please log in to save favorites." });
      return;
    }
    const response = await listingsAPI.toggleWishlist(listing.id);
    if (response.success) {
      setSaved(response.data?.saved ?? !saved);
      toast({ title: response.data?.saved ? "Saved to favorites" : "Removed from favorites" });
    } else {
      toast({ variant: "destructive", title: "Could not update favorites", description: response.message });
    }
  };

  const getImageUrl = (images: string[] | Array<{url: string}>) => {
    if (Array.isArray(images) && images.length > 0) {
      return typeof images[0] === 'string' ? images[0] : images[0].url;
    }
    return "https://images.unsplash.com/photo-1587061949409-02df41d5e562";
  };

  const getLocationString = (location: string | {city: string; state?: string; country: string}) => {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.city}${location.state ? `, ${location.state}` : ''}, ${location.country}`;
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
          <button
            type="button"
            aria-label={saved ? "Remove from favorites" : "Save to favorites"}
            onClick={handleSave}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>
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
