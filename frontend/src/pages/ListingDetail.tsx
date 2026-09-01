/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListing } from "@/hooks/useListings";
import { bookingsAPI } from "@/lib/api";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PaymentDetails } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import ReviewSection from "@/components/ReviewSection";
import { Star, MapPin, Share2, Heart, Bed, Bath, Users, Wifi, UtensilsCrossed, Mountain, Coffee, Car, CircleCheck as CheckCircle2, X, ArrowLeft, ShieldCheck } from "lucide-react";

const amenityIcons: Record<string, any> = {
  "Wi-Fi": Wifi,
  "Wifi": Wifi,
  "wifi": Wifi,
  "Kitchen": UtensilsCrossed,
  "kitchen": UtensilsCrossed,
  "Mountain view": Mountain,
  "Mountain View": Mountain,
  "Breakfast": Coffee,
  "Coffee": Coffee,
  "Parking": Car,
  "Private entrance": CheckCircle2,
};

const getAmenityIcon = (amenity: string) => {
  const Icon = amenityIcons[amenity] || CheckCircle2;
  return <Icon className="h-5 w-5 text-primary" />;
};

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { listing, loading, error } = useListing(id!);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [nights, setNights] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getImageUrl = (img: string | { url: string }) =>
    typeof img === "string" ? img : img.url;

  const getAllImages = () => {
    if (!listing) return [];
    return (listing.images || []).map(getImageUrl).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-5 w-3/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="aspect-square rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-display font-semibold mb-3">
            {error ? "Something went wrong" : "Listing not found"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || "The listing you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/listings">
            <Button>Browse all listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = getAllImages();
  const locationString =
    typeof listing.location === "string"
      ? listing.location
      : `${listing.location.address}, ${listing.location.city}${listing.location.state ? `, ${listing.location.state}` : ""}, ${listing.location.country}`;

  const calculateTotalPrice = () => {
    const basePrice = listing!.price * nights;
    const cleaningFee = 25;
    const serviceFee = 15;
    return basePrice + cleaningFee + serviceFee;
  };

  const handleAvailabilityCheck = (available: boolean, startDate: Date, checkEndDate: Date) => {
    setIsAvailable(available);
    setSelectedDate(startDate);
    setEndDate(checkEndDate);
    const nightsCount = Math.ceil((checkEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    setNights(nightsCount);
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book this homestay",
        variant: "destructive",
      });
      return;
    }
    if (!selectedDate || !endDate || !isAvailable) {
      toast({
        title: "Check availability first",
        description: "Please select dates and check availability",
        variant: "destructive",
      });
      return;
    }
    setIsBooking(true);
    try {
      const bookingData = {
        listing: listing.id,
        startDate: selectedDate.toISOString(),
        endDate: endDate.toISOString(),
        guests: { adults: 1, children: 0 },
        totalPrice: calculateTotalPrice(),
      };
      const response = await bookingsAPI.createBooking(bookingData);
      if (response.success) {
        toast({ title: "Booking created", description: "Your booking has been created successfully!" });
        const paymentDetails: PaymentDetails = {
          listingId: listing.id,
          amount: calculateTotalPrice(),
          nights: nights,
          startDate: selectedDate,
          status: "pending",
        };
        navigate("/payment", { state: { paymentDetails } });
      } else {
        toast({ variant: "destructive", title: "Booking failed", description: response.message || "Failed to create booking" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Booking failed", description: error.message || "An error occurred" });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container">
        {/* Back Link */}
        <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
            {listing.title}
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{listing.rating}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{listing.reviewCount} reviews</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {typeof listing.location === "string" ? listing.location : listing.location.city}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10 md:mb-14 rounded-2xl overflow-hidden">
          {images.length > 0 && (
            <>
              <div
                className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto cursor-pointer overflow-hidden bg-secondary"
                onClick={() => setLightboxIndex(0)}
              >
                <img src={images[0]} alt={listing.title} className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-300" />
              </div>
              {images.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-[4/3] cursor-pointer overflow-hidden bg-secondary relative group"
                  onClick={() => setLightboxIndex(idx + 1)}
                >
                  <img src={img} alt={`${listing.title} ${idx + 2}`} className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-300" />
                  {idx === 3 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">+{images.length - 5} more</span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Listing Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="flex items-center gap-6 pb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{listing.bedrooms} {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{listing.bathrooms} {listing.bathrooms === 1 ? "bathroom" : "bathrooms"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{listing.maxGuests} guests</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-display font-semibold mb-3">About this place</h2>
              <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-xl font-display font-semibold mb-5">What this place offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listing.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {getAmenityIcon(amenity)}
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Grid */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-xl font-display font-semibold mb-5">Property details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-xl p-5 text-center">
                  <Bed className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-display font-semibold">{listing.bedrooms}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bedrooms</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-5 text-center">
                  <Bath className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-display font-semibold">{listing.bathrooms}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bathrooms</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-5 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-display font-semibold">{listing.maxGuests}</p>
                  <p className="text-xs text-muted-foreground mt-1">Max guests</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="pt-6 border-t border-border">
              <ReviewSection listingId={listing.id} canReview={user?.role === "guest"} />
            </div>
          </div>

          {/* Booking Card */}
          <div>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sticky top-24">
              <div className="flex justify-between items-baseline mb-5">
                <div>
                  <span className="text-2xl font-display font-semibold">${listing.price}</span>
                  <span className="text-sm text-muted-foreground"> / night</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">{listing.rating}</span>
                  <span className="text-sm text-muted-foreground">· {listing.reviewCount}</span>
                </div>
              </div>

              <div className="mb-5">
                <AvailabilityChecker listingId={listing.id} onAvailabilityCheck={handleAvailabilityCheck} />
              </div>

              {selectedDate && endDate && (
                <div className="border-t border-border pt-4 mb-4 space-y-2 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dates</span>
                    <span className="font-medium">{format(selectedDate, "MMM d")} – {format(endDate, "MMM d")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">${listing.price} x {nights} nights</span>
                    <span>${listing.price * nights}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cleaning fee</span>
                    <span>$25</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>$15</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${calculateTotalPrice()}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleBooking}
                disabled={isBooking || !isAvailable || !selectedDate || !endDate}
              >
                {isBooking
                  ? "Creating booking..."
                  : !selectedDate || !endDate
                  ? "Check availability first"
                  : !isAvailable
                  ? "Not available"
                  : "Reserve"}
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Free cancellation up to 5 days before check-in
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <button className="absolute top-6 right-6 text-white/80 hover:text-white" onClick={() => setLightboxIndex(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={images[lightboxIndex]} alt={listing.title} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
