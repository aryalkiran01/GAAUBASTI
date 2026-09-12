import { useEffect, useState } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { format } from "date-fns";
import { CircleCheck as CheckCircle2, Calendar, Hop as Home, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { bookingsAPI } from "@/lib/api";

const PaymentSuccess = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verifiedPayment, setVerifiedPayment] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const paymentDetails = location.state?.paymentDetails as PaymentDetails;

  const provider = searchParams.get("provider");
  const paymentId = searchParams.get("paymentId");
  const data = searchParams.get("data"); // eSewa encoded response
  const pidx = searchParams.get("pidx"); // Khalti pidx
  const transactionUuid = searchParams.get("transaction_uuid");

  useEffect(() => {
    const verifyRedirectPayment = async () => {
      if (paymentId && (provider === "esewa" || provider === "khalti" || data || pidx)) {
        setVerifying(true);
        try {
          const res = await bookingsAPI.verifyPayment(paymentId, {
            provider,
            data,
            pidx,
            transaction_uuid: transactionUuid,
          });

          if (res.success && res.data) {
            setVerifiedPayment(res.data);
          } else {
            setVerifyError(res.message || "Failed to confirm payment with provider.");
          }
        } catch (err: any) {
          setVerifyError(err.message || "An error occurred while confirming payment.");
        } finally {
          setVerifying(false);
        }
      }
    };

    verifyRedirectPayment();
  }, [paymentId, provider, data, pidx, transactionUuid]);

  if (verifying) {
    return (
      <div className="container py-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-gaun-green mx-auto" />
          <h2 className="text-xl font-display font-semibold">Confirming your payment...</h2>
          <p className="text-xs text-muted-foreground">
            Verifying cryptographic signature and transaction status with {provider === "esewa" ? "eSewa" : provider === "khalti" ? "Khalti" : "gateway"}.
          </p>
        </div>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto border-destructive/30">
          <CardHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-lg text-destructive">Payment Verification Incomplete</CardTitle>
            <p className="text-xs text-muted-foreground">{verifyError}</p>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Link to="/account" className="w-full">
              <Button className="w-full text-xs">View Account & Bookings</Button>
            </Link>
            <Link to="/listings" className="w-full">
              <Button variant="outline" className="w-full text-xs">Browse Stays</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!paymentDetails && !verifiedPayment) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-display">Booking Confirmed</CardTitle>
            <p className="text-sm text-muted-foreground">Your reservation details are available in your account.</p>
          </CardHeader>
          <CardFooter>
            <Link to="/account" className="w-full">
              <Button className="w-full">Go to Account</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const paidAmount = verifiedPayment
    ? `Rs. ${verifiedPayment.amount?.toLocaleString()}`
    : paymentDetails?.amount
    ? `Rs. ${paymentDetails.amount?.toLocaleString()}`
    : "Confirmed";

  return (
    <div className="container py-16 md:py-24">
      <SEO title="Booking Confirmed" description="Your booking and payment have been confirmed successfully." canonicalPath="/payment-success" noindex />
      <div className="max-w-md mx-auto text-center">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-gaun-green" />
        </div>

        <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Booking Confirmed!</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Your payment has been verified with {provider ? provider.toUpperCase() : "the payment gateway"} and your stay is secured.
        </p>

        <div className="bg-secondary/50 rounded-2xl p-5 mb-8 text-left border border-border">
          <h3 className="font-semibold text-sm mb-4">Payment & Reservation Summary</h3>
          <div className="space-y-3 text-sm">
            {paymentDetails?.nights && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Duration
                </span>
                <span className="font-medium text-xs">
                  {paymentDetails.nights} {paymentDetails.nights === 1 ? "night" : "nights"}
                </span>
              </div>
            )}
            {paymentDetails?.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Check-in</span>
                <span className="font-medium text-xs">{format(new Date(paymentDetails.startDate), "MMM d, yyyy")}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between items-center font-semibold">
              <span className="text-xs">Amount Settled</span>
              <span className="text-sm text-gaun-green">{paidAmount}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-8">
          A confirmation receipt and host arrival directions have been dispatched to your email.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/account" className="w-full">
            <Button className="w-full bg-gaun-green hover:bg-gaun-light-green text-white font-semibold" size="lg">
              View Your Bookings
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/listings" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="h-4 w-4 mr-1.5" />
              Browse More Stays
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
