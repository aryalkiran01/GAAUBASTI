
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { bookingsAPI } from "@/lib/api";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const paymentDetails = location.state?.paymentDetails as PaymentDetails;

  const [isProcessing, setIsProcessing] = useState(false);

  if (!paymentDetails) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Payment Request</CardTitle>
            <CardDescription>
              No payment details were provided. Please go back to a listing and make a reservation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/listings")} className="w-full">
              Browse Listings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const paymentResponse = await bookingsAPI.createPayment({
        bookingId: paymentDetails.bookingId,
        listingId: paymentDetails.listingId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || "USD"
      });

      if (!paymentResponse.success || !paymentResponse.data?.paymentId) {
        throw new Error(paymentResponse.message || "Unable to start payment");
      }

      const verificationResponse = await bookingsAPI.verifyPayment(
        paymentResponse.data.paymentId,
        paymentResponse.data.providerPaymentId
      );

      if (!verificationResponse.success) {
        throw new Error(verificationResponse.message || "Payment verification failed");
      }

      toast({
        title: "Payment Successful",
        description: `Your payment of $${paymentDetails.amount} has been processed successfully.`
      });

      navigate("/payment-success", {
        state: {
          paymentDetails: {
            ...paymentDetails,
            status: "completed"
          }
        }
      });
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unable to complete payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
            <CardDescription>
              Secure server-side payment verification for your stay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="bg-gaun-cream/50 rounded-md p-4 mb-6">
                <h3 className="font-semibold mb-2">Booking Summary</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {paymentDetails.nights} {paymentDetails.nights === 1 ? "night" : "nights"}
                </p>
                {paymentDetails.startDate && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Check-in: {format(paymentDetails.startDate, "PPP")}
                  </p>
                )}
                <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>${paymentDetails.amount}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Your payment is verified server-side before the booking is confirmed.
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gaun-green hover:bg-gaun-light-green"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : `Pay $${paymentDetails.amount}`}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
