import { Link } from "react-router-dom";
import { Listing } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Bed, Bath, Users, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { user } = useAuth();
  const { toggle, isSaved, loading } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const saved = isSaved(listing.id);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save listings.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const response = await toggle(listing.id);
    if (response.success) {
      toast({
        title: response.data?.saved ? "Saved to wishlist" : "Removed from wishlist",
      });
    } else {
      toast({
        title: "Action failed",
        description: response.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Link to={`/listing/${listing.id}`} className="block h-full group" aria-label={`View ${listing.title}`}>
      <Card className="overflow-hidden border-border hover:shadow-lg transition-shadow duration-200 h-full">
        <div className="aspect-[4/3] overflow-hidden relative bg-secondary">
          <img
            src={getImageUrl(listing.images)}
            alt={listing.title}
            loading="lazy"
            className="listing-image h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/95 text-foreground hover:bg-white/95 shadow-sm border-0">
              <span className="font-semibold">${listing.price}</span>
              <span className="text-muted-foreground font-normal"> / night</span>
            </Badge>
          </div>
          {user && (
            <button
              onClick={handleToggleWishlist}
              disabled={loading}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={saved}
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-gray-600"}`}
              />
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
