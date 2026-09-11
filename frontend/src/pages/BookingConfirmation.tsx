import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { bookingsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Calendar, Users, Home, DollarSign } from "lucide-react";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("id");

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("Booking ID is missing");
        setLoading(false);
        return;
      }
      try {
        const response = await bookingsAPI.getBooking(bookingId);
        if (response.success && response.data?.booking) {
          setBooking(response.data.booking);
        } else {
          setError(response.message || "Failed to load booking details");
        }
      } catch {
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || "Booking not found"}</p>
            <Button onClick={() => navigate("/listings")}>Browse Listings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const listing = booking.listing;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your booking reference:{" "}
            <span className="font-mono font-semibold text-gray-900">
              {booking.bookingReference || booking._id || booking.id}
            </span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {typeof listing === "object" ? listing.title : "Listing"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Check-in</p>
                  <p className="font-medium">{formatDate(booking.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Check-out</p>
                  <p className="font-medium">{formatDate(booking.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Guests</p>
                  <p className="font-medium">
                    {booking.guests?.adults || 1} adults
                    {booking.guests?.children ? `, ${booking.guests.children} children` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Total Price</p>
                  <p className="font-medium">NPR {booking.totalPrice?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {booking.priceBreakdown && (
              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base price</span>
                  <span>NPR {booking.priceBreakdown.basePrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cleaning fee</span>
                  <span>NPR {booking.priceBreakdown.cleaningFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service fee</span>
                  <span>NPR {booking.priceBreakdown.serviceFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxes</span>
                  <span>NPR {booking.priceBreakdown.taxes?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Total</span>
                  <span>NPR {booking.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                booking.status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {booking.status}
              </span>
              {booking.paymentStatus && (
                <>
                  <span className="text-gray-500">Payment:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    booking.paymentStatus === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Important Information & Safety Brief</h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>• Save your booking reference for future correspondence.</li>
              <li>• Contact your host if you have special requests or need to arrange check-in.</li>
              <li>• In case of emergency during your stay: Police 100, Tourist Police 1144, Ambulance 102.</li>
              <li>• Follow local village cultural guidelines and respect natural surroundings.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/account")}>
            View My Bookings
          </Button>
          <Button onClick={() => navigate("/listings")}>Browse More</Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
