/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUserBookings,
  useBooking,
} from "@/hooks/useBookings";
import { format } from "date-fns";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  Heart,
  Trash2,
  CreditCard,
  XCircle,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { listingsAPI, paymentsAPI, bookingsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ListingCard from "@/components/ListingCard";

const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookings, loading: bookingsLoading, error: bookingsError, refetch } =
    useUserBookings();
  const { toast } = useToast();

  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true);
      const response = await listingsAPI.getWishlist();
      if (response.success) {
        const items = (response.data.items || [])
          .map((item: any) => item.listing)
          .filter((listing: any) => listing && listing._id);
        setWishlistItems(items);
      } else {
        setWishlistError(response.message);
      }
    } catch (err: any) {
      setWishlistError(err.message);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      const response = await paymentsAPI.getPaymentHistory({ limit: 20 });
      if (response.success) {
        setPayments(response.data.payments || []);
      } else {
        setPaymentsError(response.message);
      }
    } catch (err: any) {
      setPaymentsError(err.message);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlist();
      fetchPayments();
    }
  }, [user, fetchWishlist, fetchPayments]);

  if (!user) {
    return null;
  }

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    setCancelling(true);
    try {
      const response = await bookingsAPI.cancelBooking(
        cancelBookingId,
        cancelReason.trim() || undefined,
      );
      if (response.success) {
        toast({
          title: "Booking cancelled",
          description: response.data?.refundAmount
            ? `Refund amount: $${response.data.refundAmount}`
            : undefined,
        });
        setCancelBookingId(null);
        setCancelReason("");
        refetch();
      } else {
        toast({
          title: "Failed to cancel",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to cancel",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleRemoveWishlist = async (listingId: string) => {
    const response = await listingsAPI.removeWishlistItem(listingId);
    if (response.success) {
      setWishlistItems((prev) =>
        prev.filter((item) => item._id !== listingId),
      );
      toast({ title: "Removed from wishlist" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen py-12">
      <SEO
        title="My Account"
        description="View your bookings, favorites, and payment history."
        canonicalPath="/account"
        noindex
      />
      <div className="container">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-full md:w-1/4">
            <div className="p-6 bg-white border rounded-lg">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-24 w-24 rounded-full overflow-hidden mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gaun-green/20 flex items-center justify-center">
                      <span className="text-2xl font-medium text-gaun-green">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-medium">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>

              <div className="space-y-2">
                <Link to="/wishlist">
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="mr-2 h-4 w-4" />
                    Saved Listings
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="outline" className="w-full justify-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Messages
                  </Button>
                </Link>
                <Link to="/listings">
                  <Button variant="outline" className="w-full justify-start">
                    <Home className="mr-2 h-4 w-4" />
                    Browse Stays
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="w-full md:w-3/4">
            <h1 className="text-3xl font-serif font-bold mb-6">My Dashboard</h1>

            <Tabs defaultValue="bookings" className="w-full">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                <TabsTrigger value="favorites">
                  Favorites ({wishlistItems.length})
                </TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                {user.role === "host" && (
                  <TabsTrigger value="listings">My Listings</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="bookings" className="mt-6">
                <h2 className="text-xl font-medium mb-4">Your Stays</h2>

                {bookingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row bg-white border rounded-lg overflow-hidden"
                      >
                        <Skeleton className="md:w-1/4 h-48 md:h-32" />
                        <div className="p-4 md:p-6 flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookingsError ? (
                  <div
                    className="text-center py-12 border rounded-lg"
                    role="alert"
                  >
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium mb-1">
                      Error loading bookings
                    </h3>
                    <p className="text-muted-foreground mb-4">{bookingsError}</p>
                    <Button variant="outline" onClick={refetch}>
                      Try again
                    </Button>
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => {
                      const listingData =
                        typeof booking.listing === "string"
                          ? null
                          : booking.listing;
                      const bookingId = booking._id || booking.id;
                      const canCancel =
                        booking.status === "pending" ||
                        booking.status === "confirmed";

                      return (
                        <div
                          key={bookingId}
                          className="flex flex-col md:flex-row bg-white border rounded-lg overflow-hidden"
                        >
                          <div className="md:w-1/4">
                            <img
                              src={
                                typeof listingData?.images?.[0] === "string"
                                  ? listingData?.images?.[0]
                                  : listingData?.images?.[0]?.url ||
                                    "https://images.unsplash.com/photo-1587061949409-02df41d5e562"
                              }
                              alt={listingData?.title || "Homestay"}
                              loading="lazy"
                              className="h-48 md:h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-4 md:p-6 flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div>
                                <h3 className="text-lg font-medium mb-1">
                                  {listingData?.title || "Homestay"}
                                </h3>
                                <p className="text-muted-foreground text-sm flex items-center">
                                  <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                                  {typeof listingData?.location === "string"
                                    ? listingData.location
                                    : listingData?.location
                                      ? `${listingData.location.address}, ${listingData.location.city}${listingData.location.state ? `, ${listingData.location.state}` : ""}, ${listingData.location.country}`
                                      : "Nepal"}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium capitalize self-start ${getStatusColor(booking.status)}`}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <div className="bg-gaun-cream/60 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(
                                  new Date(booking.startDate),
                                  "MMM d",
                                )}{" "}
                                –{" "}
                                {format(
                                  new Date(booking.endDate),
                                  "MMM d, yyyy",
                                )}
                              </div>
                              <div className="bg-gaun-cream/60 px-3 py-1 rounded-full text-sm">
                                {Math.ceil(
                                  (new Date(booking.endDate).getTime() -
                                    new Date(booking.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                )}{" "}
                                nights
                              </div>
                              {booking.paymentStatus && (
                                <div className="bg-gaun-cream/60 px-3 py-1 rounded-full text-sm capitalize">
                                  Payment: {booking.paymentStatus}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                              <div>
                                <span className="font-medium">
                                  ${booking.totalPrice}
                                </span>{" "}
                                total
                              </div>
                              <div className="flex gap-2">
                                {listingData && (
                                  <Link
                                    to={`/listing/${
                                      typeof listingData === "string"
                                        ? listingData
                                        : listingData._id || listingData.id
                                    }`}
                                  >
                                    <Button variant="outline" size="sm">
                                      View details
                                    </Button>
                                  </Link>
                                )}
                                {canCancel && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCancelBookingId(bookingId)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <Calendar
                      className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium mb-1">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start exploring homestays to plan your next adventure
                    </p>
                    <Link to="/listings">
                      <Button className="bg-gaun-green hover:bg-gaun-light-green">
                        Browse homestays
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="favorites" className="mt-6">
                {wishlistLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-3">
                        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : wishlistError ? (
                  <div className="text-center py-12 border rounded-lg" role="alert">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-muted-foreground mb-4">{wishlistError}</p>
                    <Button variant="outline" onClick={fetchWishlist}>
                      Try again
                    </Button>
                  </div>
                ) : wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {wishlistItems.map((listing: any) => (
                      <div key={listing._id} className="relative h-full">
                        <ListingCard
                          listing={{ ...listing, id: listing._id }}
                        />
                        <button
                          onClick={() => handleRemoveWishlist(listing._id)}
                          aria-label="Remove from wishlist"
                          className="absolute bottom-4 right-4 z-10 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <Heart
                      className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium mb-1">
                      No favorites yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Save homestays you love by clicking the heart icon
                    </p>
                    <Link to="/listings">
                      <Button className="bg-gaun-green hover:bg-gaun-light-green">
                        Browse homestays
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <h2 className="text-xl font-medium mb-4">Payment History</h2>

                {paymentsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : paymentsError ? (
                  <div className="text-center py-12 border rounded-lg" role="alert">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-muted-foreground mb-4">{paymentsError}</p>
                    <Button variant="outline" onClick={fetchPayments}>
                      Try again
                    </Button>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment: any) => (
                      <div
                        key={payment._id}
                        className="flex items-center justify-between p-4 bg-white border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gaun-cream/60 flex items-center justify-center shrink-0">
                            <CreditCard className="h-5 w-5 text-gaun-green" />
                          </div>
                          <div>
                            <p className="font-medium">
                              ${payment.amount}{" "}
                              <span className="text-sm text-muted-foreground">
                                {payment.currency}
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.booking?.title || "Booking payment"} ·{" "}
                              {format(
                                new Date(payment.createdAt),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <CreditCard
                      className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium mb-1">
                      No payment history
                    </h3>
                    <p className="text-muted-foreground">
                      Your payment transactions will appear here
                    </p>
                  </div>
                )}
              </TabsContent>

              {user.role === "host" && (
                <TabsContent value="listings" className="mt-6">
                  <div className="text-center py-12 border rounded-lg">
                    <Home
                      className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium mb-1">
                      Manage your listings
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Visit your host dashboard to add or edit homestays
                    </p>
                    <Link to="/host">
                      <Button className="bg-gaun-green hover:bg-gaun-light-green">
                        Go to host dashboard
                      </Button>
                    </Link>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog
        open={!!cancelBookingId}
        onOpenChange={(open) => {
          if (!open) {
            setCancelBookingId(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              You can provide a reason for cancellation (optional). Refund
              amount will be calculated based on the cancellation policy.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            aria-label="Cancellation reason"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelBookingId(null);
                setCancelReason("");
              }}
              disabled={cancelling}
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;
