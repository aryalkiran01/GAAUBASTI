/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListing } from "@/hooks/useListings";
import { bookingsAPI, conversationsAPI, villageAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PaymentDetails, Village } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import ReviewSection from "@/components/ReviewSection";
import ReviewSummary from "@/components/ai/ReviewSummary";
import MapView from "@/components/MapView";
import SEO, { getLodgingSchema } from "@/components/SEO";
import {
  Heart,
  Share2,
  MessageCircle,
  Star,
  Minus,
  Plus,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Home,
  Users,
  Bed,
  Bath,
  ArrowRight,
  Info,
  ChevronLeft,
} from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { listing, loading, error } = useListing(id!);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [nights, setNights] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [reviewableBookingId, setReviewableBookingId] = useState<string | undefined>(undefined);
  const [associatedVillage, setAssociatedVillage] = useState<Village | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggle, isSaved, checkStatus, loading: wishlistLoading } = useWishlist();

  useEffect(() => {
    if (user && id) {
      checkStatus([id]);
    }
  }, [user, id, checkStatus]);

  useEffect(() => {
    if (user && id) {
      bookingsAPI.getUserBookings({ listing: id }).then((res) => {
        if (res.success) {
          const completed = (res.data.bookings || []).find(
            (b: any) => b.status === 'completed' && (b.listing === id || b.listing?._id === id || b.listing?.id === id)
          );
          if (completed) {
            setReviewableBookingId(completed._id || completed.id);
          }
        }
      }).catch(() => {});
    }
  }, [user, id]);

  // Fetch associated village if city/village is known
  useEffect(() => {
    if (listing?.location) {
      const loc = typeof listing.location === "object" ? listing.location : null;
      const vName = (loc as any)?.village || (loc as any)?.city;
      if (vName) {
        const slug = vName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        villageAPI.getVillageBySlug(slug).then((res) => {
          if (res.success && res.data?.village) {
            setAssociatedVillage(res.data.village);
          }
        }).catch(() => {});
      }
    }
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-background">
        <div className="container max-w-6xl space-y-8">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center container text-center space-y-4">
        <h1 className="text-2xl font-display font-bold">
          {error ? 'Error loading listing' : 'Listing not found'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {error || "The listing you're looking for doesn't exist or has been removed."}
        </p>
        <Link to="/listings">
          <Button size="sm" className="bg-gaun-green hover:bg-gaun-light-green text-white">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Browse all listings
          </Button>
        </Link>
      </div>
    );
  }

  const basePrice = listing.price * nights;
  const cleaningFee = 15;
  const serviceFee = Math.round(basePrice * 0.08);
  const totalAmount = basePrice + cleaningFee + serviceFee;

  const handleAvailabilityCheck = (available: boolean, startDate: Date, checkEndDate: Date) => {
    setIsAvailable(available);
    setSelectedDate(startDate);
    setEndDate(checkEndDate);
    const nightsCount = Math.max(1, Math.ceil((checkEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    setNights(nightsCount);
  };

  const handleMessageHost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to message the host.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const hostId = (listing as any)?.host?._id || (listing as any)?.host?.id || (listing as any)?.hostId;
    if (!hostId) {
      toast({
        title: "Host unavailable",
        description: "This listing does not currently have an active host profile.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await conversationsAPI.createConversation({
        listingId: listing.id,
        participantIds: [hostId],
      });

      if (response.success && response.data?.conversation) {
        navigate(`/messages?conversationId=${response.data.conversation._id || response.data.conversation.id}`);
      } else {
        toast({
          variant: "destructive",
          title: "Unable to start chat",
          description: response.message || "We could not start a conversation right now.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Unable to start chat",
        description: err.message || "Failed to start conversation.",
      });
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book this homestay",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!selectedDate || !endDate) {
      toast({
        title: "Dates required",
        description: "Please check and select availability dates first.",
        variant: "destructive",
      });
      return;
    }

    if (!isAvailable) {
      toast({
        title: "Dates unavailable",
        description: "Please select available dates on the calendar.",
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
        guests: { adults, children },
      };

      const response = await bookingsAPI.createBooking(bookingData);

      if (response.success) {
        const booking = response.data?.booking;
        const bookingId = booking?._id || booking?.id;

        toast({
          title: "Booking created",
          description: "Proceeding to secure checkout.",
        });

        const paymentDetails: PaymentDetails = {
          bookingId,
          listingId: listing.id,
          amount: totalAmount,
          nights: nights,
          startDate: selectedDate,
          status: 'pending',
          currency: 'USD',
        };

        navigate("/payment", { state: { paymentDetails } });
      } else {
        toast({
          variant: "destructive",
          title: "Booking failed",
          description: response.message || "Failed to create booking",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: err.message || "An error occurred while creating booking",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const saved = isSaved(listing.id);

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to save listings.", variant: "destructive" });
      navigate("/login");
      return;
    }
    const response = await toggle(listing.id);
    if (response.success) {
      toast({ title: response.data?.saved ? "Saved to wishlist" : "Removed from wishlist" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const locObj = typeof listing.location === "object" ? listing.location : null;
  const locationString = locObj
    ? `${(locObj as any).address || (locObj as any).city}, ${(locObj as any).district || (locObj as any).province || "Nepal"}`
    : String(listing.location);

  const imagesList = Array.isArray(listing.images)
    ? listing.images.map((img) => (typeof img === "string" ? img : img.url))
    : ["https://images.unsplash.com/photo-1544735716-392fe2489ffa"];

  const listingCoordinates = (locObj as any)?.coordinates
    ? { lat: (locObj as any).coordinates.latitude, lng: (locObj as any).coordinates.longitude }
    : undefined;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-16">
      <SEO
        title={`${listing.title} — ${locationString} | Gaun Basti`}
        description={`${listing.title} in ${locationString}. ${listing.description?.slice(0, 150) || ""}`}
        canonicalPath={`/listing/${listing.id}`}
        image={imagesList[0]}
        schema={getLodgingSchema({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          images: imagesList,
          location: typeof listing.location === 'object' ? listing.location : undefined,
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          amenities: listing.amenities
        })}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Listings", url: "/listings" },
          { name: listing.title, url: `/listing/${listing.id}` }
        ]}
      />

      {/* Header Container */}
      <div className="container max-w-6xl pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{listing.rating || "New"}</span>
                {listing.reviewCount > 0 && <span className="font-normal text-muted-foreground">({listing.reviewCount} reviews)</span>}
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gaun-green" />
                {locationString}
              </span>
              {associatedVillage && (
                <>
                  <span>•</span>
                  <Link
                    to={`/villages/${associatedVillage.slug}`}
                    className="text-gaun-green hover:underline font-medium"
                  >
                    {associatedVillage.name} Village
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="h-8 text-xs">
              <Share2 className="h-3.5 w-3.5 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className="h-8 text-xs"
            >
              <Heart className={`h-3.5 w-3.5 mr-1 ${saved ? "fill-red-500 text-red-500" : ""}`} />
              {saved ? "Saved" : "Save"}
            </Button>
            {user && (
              <Button variant="outline" size="sm" onClick={handleMessageHost} className="h-8 text-xs">
                <MessageCircle className="h-3.5 w-3.5 mr-1 text-gaun-green" />
                Message Host
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery Mosaic */}
      <section className="container max-w-6xl mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden shadow-md max-h-[460px]">
          <div className="md:col-span-2 aspect-[4/3] md:aspect-auto overflow-hidden bg-secondary">
            <img
              src={imagesList[0]}
              alt={listing.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
            />
          </div>
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-3">
            {imagesList.slice(1, 5).map((img, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden bg-secondary rounded-xl">
                <img
                  src={img}
                  alt={`${listing.title} photo ${i + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content & Sticky Booking Card */}
      <div className="container max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Details, Host, Amenities, Map & Reviews */}
        <div className="lg:col-span-7 space-y-10">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-secondary/40 border border-border rounded-2xl text-center text-xs">
            <div>
              <Users className="h-4 w-4 mx-auto text-gaun-green mb-1" />
              <span className="font-semibold text-foreground">{listing.maxGuests} Guests</span>
            </div>
            <div>
              <Bed className="h-4 w-4 mx-auto text-gaun-green mb-1" />
              <span className="font-semibold text-foreground">{listing.bedrooms} Bedroom</span>
            </div>
            <div>
              <Bath className="h-4 w-4 mx-auto text-gaun-green mb-1" />
              <span className="font-semibold text-foreground">{listing.bathrooms} Bath</span>
            </div>
            <div>
              <Home className="h-4 w-4 mx-auto text-gaun-green mb-1" />
              <span className="font-semibold text-foreground capitalize">{listing.category || "Homestay"}</span>
            </div>
          </div>

          {/* About This Stay */}
          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold">About this authentic stay</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Host Profile Card */}
          <div className="p-5 border border-border rounded-2xl bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={(listing.host as any)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
                alt={(listing.host as any)?.name || "Host"}
                className="w-12 h-12 rounded-full object-cover border"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm">Hosted by {(listing.host as any)?.name || "Local Family"}</h3>
                  <ShieldCheck className="h-4 w-4 text-gaun-green" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {(listing.host as any)?.hostProfile?.bio || "Certified community host welcoming travelers with authentic Himalayan warmth."}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleMessageHost} className="text-xs shrink-0">
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Contact Host
            </Button>
          </div>

          {/* Associated Village Card */}
          {associatedVillage && (
            <div className="p-5 border border-border rounded-2xl bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-gaun-green uppercase tracking-wider">
                  Destination Highlights
                </span>
                <h3 className="font-display font-bold text-base">Located in {associatedVillage.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {associatedVillage.description}
                </p>
              </div>
              <Link to={`/villages/${associatedVillage.slug}`} className="shrink-0">
                <Button size="sm" className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs">
                  Explore Village
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {/* Amenities Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold">What this stay offers</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {listing.amenities && listing.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card text-xs">
                  <CheckCircle2 className="h-4 w-4 text-gaun-green shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules & Safety Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 border border-border rounded-2xl bg-card space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Info className="h-4 w-4 text-gaun-green" />
                House Rules
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check-in: 12:00 PM – 8:00 PM</li>
                <li>• Check-out: 11:00 AM</li>
                <li>• Respect local village quiet hours (after 10 PM)</li>
                <li>• Footwear removed at room entrances</li>
              </ul>
            </div>

            <div className="p-5 border border-border rounded-2xl bg-card space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-gaun-green" />
                Safety & Emergency Info
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                {listing.safetyAndEmergency?.nearbyHospital && (
                  <li>• <strong className="text-foreground">Hospital/Clinic:</strong> {listing.safetyAndEmergency.nearbyHospital}</li>
                )}
                {listing.safetyAndEmergency?.policeStationContact && (
                  <li>• <strong className="text-foreground">Local Police:</strong> {listing.safetyAndEmergency.policeStationContact}</li>
                )}
                {listing.safetyAndEmergency?.emergencyContactPhone && (
                  <li>• <strong className="text-foreground">Emergency Line:</strong> {listing.safetyAndEmergency.emergencyContactPhone}</li>
                )}
                {listing.safetyAndEmergency?.importantLocationNotes && (
                  <li>• <strong className="text-foreground">Location Advisory:</strong> {listing.safetyAndEmergency.importantLocationNotes}</li>
                )}
                {listing.safetyAndEmergency?.safetyNotes && listing.safetyAndEmergency.safetyNotes.length > 0 ? (
                  listing.safetyAndEmergency.safetyNotes.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))
                ) : (
                  <>
                    <li>• First aid supplies available with host family</li>
                    <li>• Community health post accessible in village</li>
                    <li>• Emergency police contact: 100 / Ambulance: 102</li>
                    <li>• Filtered / boiled drinking water served</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Interactive Map Location */}
          <div className="space-y-3">
            <h3 className="text-lg font-display font-bold">Where you'll be</h3>
            <div className="h-[300px] rounded-2xl overflow-hidden border border-border shadow-sm">
              <MapView
                listings={[listing]}
                center={listingCoordinates}
                zoom={14}
                enableAreaSearch={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">{locationString}</p>
          </div>

          {/* AI Review Summary & Reviews Section */}
          <div className="space-y-6 pt-6 border-t border-border">
            <ReviewSummary listingId={listing.id} />
            <ReviewSection
              listingId={listing.id}
              canReview={!!reviewableBookingId}
              bookingId={reviewableBookingId}
            />
          </div>
        </div>

        {/* Right Column: Sticky Reservation Widget (Desktop) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 border border-border rounded-3xl p-6 bg-card shadow-lg space-y-6">
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <div>
                <span className="text-2xl font-bold font-display text-foreground">${listing.price}</span>
                <span className="text-xs text-muted-foreground"> / night</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{listing.rating || "New"}</span>
                {listing.reviewCount > 0 && <span className="text-muted-foreground font-normal">({listing.reviewCount})</span>}
              </div>
            </div>

            {/* Availability Date Picker */}
            <div className="space-y-3">
              <AvailabilityChecker
                listingId={listing.id}
                onAvailabilityCheck={handleAvailabilityCheck}
              />
            </div>

            {/* Guest Selector */}
            <div className="p-3 border border-border rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">Adults</span>
                  <p className="text-[10px] text-muted-foreground">Ages 13+</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-semibold w-4 text-center">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(Math.min(listing.maxGuests, adults + 1))}
                    className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div>
                  <span className="font-semibold text-foreground">Children</span>
                  <p className="text-[10px] text-muted-foreground">Ages 2–12</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-semibold w-4 text-center">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren(children + 1)}
                    className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            {selectedDate && endDate && isAvailable && (
              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>${listing.price} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                  <span>${basePrice}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cleaning fee</span>
                  <span>${cleaningFee}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Community service fee</span>
                  <span>${serviceFee}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2 border-t text-sm">
                  <span>Total (USD)</span>
                  <span className="text-gaun-green">${totalAmount}</span>
                </div>
              </div>
            )}

            {/* Booking CTA Button */}
            <Button
              onClick={handleBooking}
              disabled={isBooking}
              className="w-full bg-gaun-green hover:bg-gaun-light-green text-white font-semibold py-5 text-sm rounded-xl shadow"
            >
              {isBooking ? "Reserving..." : isAvailable ? "Reserve Now" : "Check Dates to Reserve"}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              You won’t be charged yet. 100% of accommodation fees benefit local families.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border p-4 z-40 flex items-center justify-between shadow-2xl">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">${listing.price}</span>
            <span className="text-xs text-muted-foreground">/ night</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{listing.rating || "New"}</span>
          </div>
        </div>
        <Button
          onClick={handleBooking}
          disabled={isBooking}
          className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs font-semibold px-6"
        >
          {isAvailable ? "Reserve" : "Check Dates"}
        </Button>
      </div>
    </div>
  );
}