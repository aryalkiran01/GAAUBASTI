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
import { Loader as Loader2, CreditCard, Wallet, CheckCircle2, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type ProviderOption = "stripe" | "esewa" | "khalti";

interface PaymentInitResponse {
  paymentId: string;
  provider: ProviderOption;
  providerPaymentId?: string;
  clientSecret?: string;
  paymentUrl?: string;
  formData?: Record<string, string | number>;
  amount: number;
  currency: string;
  priceBreakdown?: {
    basePrice: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
  };
}

const USD_TO_NPR_RATE = 135;

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const paymentDetails = location.state?.paymentDetails as PaymentDetails;

  const [selectedProvider, setSelectedProvider] = useState<ProviderOption>("stripe");
  const [isInitializing, setIsInitializing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentInitResponse | null>(null);
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

  const nprAmount = Number(paymentDetails.amount) || 0;
  const usdAmount = Math.max(1, Math.round(nprAmount / USD_TO_NPR_RATE));

  const handleInitializePayment = async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      const paymentResponse = await bookingsAPI.createPayment({
        bookingId: paymentDetails.bookingId,
        listingId: paymentDetails.listingId,
        provider: selectedProvider,
        currency: selectedProvider === "stripe" ? "USD" : "NPR",
      });

      if (!paymentResponse.success || !paymentResponse.data?.paymentId) {
        throw new Error(paymentResponse.message || "Unable to start payment");
      }

      const data = paymentResponse.data;

      setPaymentData({
        paymentId: data.paymentId,
        provider: data.provider || selectedProvider,
        providerPaymentId: data.providerPaymentId,
        clientSecret: data.clientSecret,
        paymentUrl: data.paymentUrl,
        formData: data.formData,
        amount: data.amount ?? (selectedProvider === "stripe" ? usdAmount : nprAmount),
        currency: data.currency ?? (selectedProvider === "stripe" ? "USD" : "NPR"),
        priceBreakdown: data.priceBreakdown,
      });

      // If eSewa has form data for POST redirect
      if (selectedProvider === "esewa" && data.formData && data.paymentUrl) {
        // Automatically submit hidden form to eSewa gateway
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl;
        for (const [key, val] of Object.entries(data.formData)) {
          const hiddenField = document.createElement("input");
          hiddenField.type = "hidden";
          hiddenField.name = key;
          hiddenField.value = String(val);
          form.appendChild(hiddenField);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // If Khalti returns a redirect URL
      if (selectedProvider === "khalti" && data.paymentUrl && data.paymentUrl.startsWith("http")) {
        window.location.href = data.paymentUrl;
        return;
      }
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

  const breakdown = paymentData?.priceBreakdown;
  const displayAmount = paymentData?.amount ?? (selectedProvider === "stripe" ? usdAmount : nprAmount);
  const displayCurrency = paymentData?.currency ?? (selectedProvider === "stripe" ? "USD" : "NPR");

  return (
    <div className="container py-12">
      <SEO title="Payment" description="Complete your booking payment securely via Stripe, eSewa, or Khalti." canonicalPath="/payment" noindex />
      <div className="max-w-md mx-auto">
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Complete Your Payment</CardTitle>
            <CardDescription>
              Select your preferred payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-secondary/40 rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-sm mb-2">Booking Summary</h3>
                <p className="text-xs text-muted-foreground mb-1">
                  {paymentDetails.nights} {paymentDetails.nights === 1 ? "night" : "nights"}
                </p>
                {paymentDetails.startDate && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Check-in: {format(new Date(paymentDetails.startDate), "PPP")}
                  </p>
                )}
                {breakdown && (
                  <div className="space-y-1 mt-2 text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <span>Base price</span>
                      <span>Rs. {breakdown.basePrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning fee</span>
                      <span>Rs. {breakdown.cleaningFee?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community fee</span>
                      <span>Rs. {breakdown.serviceFee?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="border-t border-border mt-3 pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold">Total to Pay</span>
                  <div className="text-right">
                    <div className="font-bold text-base text-gaun-green">
                      Rs. {nprAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Provider Selection */}
              {!paymentData?.clientSecret && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground">Choose Payment Gateway</label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Stripe Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("stripe")}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedProvider === "stripe"
                          ? "border-gaun-green bg-gaun-green/10 text-gaun-green font-semibold shadow-sm"
                          : "border-border hover:bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs">Debit/Card</span>
                      <span className="text-[9px] text-muted-foreground font-mono">NPR/Card</span>
                    </button>

                    {/* eSewa */}
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("esewa")}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedProvider === "esewa"
                          ? "border-green-600 bg-green-600/10 text-green-700 font-semibold shadow-sm"
                          : "border-border hover:bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <Wallet className="h-5 w-5 text-green-600" />
                      <span className="text-xs">eSewa</span>
                      <span className="text-[9px] text-muted-foreground font-mono">NPR</span>
                    </button>

                    {/* Khalti */}
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("khalti")}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedProvider === "khalti"
                          ? "border-purple-600 bg-purple-600/10 text-purple-700 font-semibold shadow-sm"
                          : "border-border hover:bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <Wallet className="h-5 w-5 text-purple-600" />
                      <span className="text-xs">Khalti</span>
                      <span className="text-[9px] text-muted-foreground font-mono">NPR</span>
                    </button>
                  </div>
                </div>
              )}

              {initError && (
                <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {initError}
                </div>
              )}

              {/* Stripe Payment Form */}
              {paymentData?.clientSecret && selectedProvider === "stripe" ? (
                stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentData.clientSecret,
                      appearance,
                    }}
                  >
                    <StripePaymentForm
                      paymentId={paymentData.paymentId}
                      clientSecret={paymentData.clientSecret}
                      amount={paymentData.amount}
                      bookingId={paymentDetails.bookingId}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                    Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-gaun-green" />
                      Server-Authoritative Pricing Protection
                    </div>
                    <p>
                      {selectedProvider === "stripe"
                        ? "Enter your international debit or credit card. Payments are processed securely via Stripe."
                        : selectedProvider === "esewa"
                        ? "You will be redirected to eSewa to authorize payment in NPR (Nepalese Rupees)."
                        : "You will be redirected to Khalti Digital Wallet to complete payment in NPR."}
                    </p>
                  </div>

                  <Button
                    className="w-full min-h-[44px] bg-gaun-green hover:bg-gaun-light-green text-white font-semibold flex items-center justify-center gap-2"
                    onClick={handleInitializePayment}
                    disabled={isInitializing}
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to {selectedProvider === "stripe" ? "Stripe" : selectedProvider === "esewa" ? "eSewa" : "Khalti"}...
                      </>
                    ) : (
                      <>
                        <span>
                          Pay Rs. {nprAmount.toLocaleString()}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </>
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
