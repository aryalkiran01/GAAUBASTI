import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { bookingsAPI } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";
import { Loader as Loader2 } from "lucide-react";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface PaymentIntentData {
  paymentId: string;
  providerPaymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const paymentDetails = location.state?.paymentDetails as PaymentDetails;

  const [isInitializing, setIsInitializing] = useState(false);
  const [paymentIntentData, setPaymentIntentData] = useState<PaymentIntentData | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

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

  const handleInitializePayment = async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      const paymentResponse = await bookingsAPI.createPayment({
        bookingId: paymentDetails.bookingId,
        listingId: paymentDetails.listingId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || "USD",
      });

      if (!paymentResponse.success || !paymentResponse.data?.paymentId) {
        throw new Error(paymentResponse.message || "Unable to start payment");
      }

      const clientSecret = paymentResponse.data.clientSecret;

      if (!clientSecret) {
        throw new Error("Payment provider did not return a client secret. Check that Stripe is configured on the server.");
      }

      setPaymentIntentData({
        paymentId: paymentResponse.data.paymentId,
        providerPaymentId: paymentResponse.data.providerPaymentId,
        clientSecret,
        amount: paymentResponse.data.amount ?? paymentDetails.amount,
        currency: paymentResponse.data.currency ?? paymentDetails.currency ?? "USD",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to initialize payment";
      setInitError(message);
      toast({
        variant: "destructive",
        title: "Payment initialization failed",
        description: message,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate("/payment-success", {
      state: {
        paymentDetails: {
          ...paymentDetails,
          status: "completed",
        },
      },
    });
  };

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#14532D",
    },
  };

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
            <CardDescription>
              Secure payment processed by Stripe
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

              {initError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
                  {initError}
                </div>
              )}

              {paymentIntentData ? (
                stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentIntentData.clientSecret,
                      appearance,
                    }}
                  >
                    <StripePaymentForm
                      paymentId={paymentIntentData.paymentId}
                      providerPaymentId={paymentIntentData.providerPaymentId}
                      amount={paymentIntentData.amount}
                      bookingId={paymentDetails.bookingId}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Your payment is verified server-side before the booking is confirmed. Click below to enter your card details securely via Stripe.
                  </div>

                  <Button
                    className="w-full bg-gaun-green hover:bg-gaun-light-green"
                    onClick={handleInitializePayment}
                    disabled={isInitializing}
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparing payment...
                      </>
                    ) : (
                      `Pay $${paymentDetails.amount}`
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
