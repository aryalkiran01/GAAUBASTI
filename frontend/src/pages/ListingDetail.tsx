import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListing } from "@/hooks/useListings";
import { bookingsAPI } from "@/lib/api";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PaymentDetails } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import ReviewSection from "@/components/ReviewSection";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { listing, loading, error } = useListing(id!);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [nights, setNights] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container">
          <div className="mb-8">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">
            {error ? 'Error loading listing' : 'Listing not found'}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {error || "The listing you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/listings">
            <Button className="bg-gaun-green hover:bg-gaun-light-green">
              Browse all listings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
    
    if (!selectedDate || !endDate) {
      toast({
        title: "Date required",
        description: "Please check availability first",
        variant: "destructive",
      });
      return;
    }

    if (!isAvailable) {
      toast({
        title: "Availability required",
        description: "Please check availability for your selected dates",
        variant: "destructive",
      });
      return;
    }
    setIsBooking(true);
    
    try {
      // Create booking via API
      const bookingData = {
        listing: listing.id,
        startDate: selectedDate.toISOString(),
        endDate: endDate.toISOString(),
        guests: { adults: 1, children: 0 }, // Default for now
        totalPrice: calculateTotalPrice()
      };
      
      const response = await bookingsAPI.createBooking(bookingData);
      
      if (response.success) {
        toast({
          title: "Booking created",
          description: "Your booking has been created successfully!",
        });
        
        // Navigate to payment page with booking details
        const paymentDetails: PaymentDetails = {
          listingId: listing.id,
          amount: calculateTotalPrice(),
          nights: nights,
          startDate: selectedDate,
          status: 'pending'
        };
        
        navigate("/payment", { state: { paymentDetails } });
      } else {
        toast({
          variant: "destructive",
          title: "Booking failed",
          description: response.message || "Failed to create booking",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "An error occurred while creating the booking",
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        {/* Listing Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">{listing.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-yellow-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 font-medium">{listing.rating}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{listing.reviewCount} reviews</span>
              <span className="text-muted-foreground">·</span>
              <span>
                {typeof listing.location === "string"
                  ? listing.location
                  : `${listing.location.address}, ${listing.location.city}${listing.location.state ? `, ${listing.location.state}` : ""}, ${listing.location.country}`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Share
              </Button>
              <Button variant="outline" size="sm">
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={typeof listing.images[0] === "string" ? listing.images[0] : listing.images[0]?.url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={
                typeof listing.images[1] === "string"
                  ? listing.images[1]
                  : listing.images[1]?.url ||
                    (typeof listing.images[0] === "string"
                      ? listing.images[0]
                      : listing.images[0]?.url)
              }
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Listing Details */}
          <div className="md:col-span-2">
            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-serif font-semibold mb-2">About this place</h2>
              <p className="text-muted-foreground">{listing.description}</p>
            </div>

            <div className="border-b pb-6 mb-6">
              <h3 className="text-xl font-medium mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-y-3">
                {listing.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 mr-2 text-gaun-green"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-4">Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gaun-cream/50 rounded-md">
                  <h4 className="font-medium">Bedrooms</h4>
                  <p className="text-xl">{listing.bedrooms}</p>
                </div>
                <div className="p-4 bg-gaun-cream/50 rounded-md">
                  <h4 className="font-medium">Bathrooms</h4>
                  <p className="text-xl">{listing.bathrooms}</p>
                </div>
                <div className="p-4 bg-gaun-cream/50 rounded-md">
                  <h4 className="font-medium">Max Guests</h4>
                  <p className="text-xl">{listing.maxGuests}</p>
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div className="border-t pt-6">
              <ReviewSection 
                listingId={listing.id}
                canReview={user?.role === 'guest'}
              />
            </div>
          </div>

          {/* Booking Card */}
          <div>
            <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">${listing!.price} <span className="text-sm font-normal">night</span></h3>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-yellow-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1">{listing!.rating}</span>
                </div>
              </div>

              {/* Availability Checker */}
              <div className="mb-6">
                <AvailabilityChecker
                  listingId={listing.id}
                  onAvailabilityCheck={handleAvailabilityCheck}
                />
              </div>

              {selectedDate && endDate && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Selected dates</span>
                    <span>{format(selectedDate, "MMM d")} - {format(endDate, "MMM d")}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>${listing!.price} x {nights} nights</span>
                    <span>${listing!.price * nights}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Cleaning fee</span>
                    <span>$25</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Service fee</span>
                    <span>$15</span>
                  </div>
                  <div className="border-t pt-4 mt-4 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${calculateTotalPrice()}</span>
                  </div>
                </div>
              )}

              {!selectedDate || !endDate &&(
                <div className="border-t pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span>${listing!.price} x {nights} nights</span>
                  <span>${listing!.price * nights}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Cleaning fee</span>
                  <span>$25</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Service fee</span>
                  <span>$15</span>
                </div>
                <div className="border-t pt-4 mt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${calculateTotalPrice()}</span>
                </div>
                </div>
              )}

              <Button
                className="w-full bg-gaun-green hover:bg-gaun-light-green"
                onClick={handleBooking}
                disabled={isBooking || !isAvailable || !selectedDate || !endDate}
              >
                {isBooking ? "Creating booking..." : 
                 !selectedDate || !endDate ? "Check availability first" :
                 !isAvailable ? "Not available" : "Reserve"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;