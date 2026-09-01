import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { format } from "date-fns";
import { CircleCheck as CheckCircle2, Calendar, Hop as Home, ArrowRight } from "lucide-react";

const PaymentSuccess = () => {
  const location = useLocation();
  const paymentDetails = location.state?.paymentDetails as PaymentDetails;

  if (!paymentDetails) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-display">Invalid payment data</CardTitle>
            <p className="text-sm text-muted-foreground">No payment details were found. Please go back to your bookings.</p>
          </CardHeader>
          <CardFooter>
            <Link to="/account" className="w-full">
              <Button className="w-full">Go to account</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-md mx-auto text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>

        <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Booking confirmed</h1>
        <p className="text-muted-foreground mb-8">Your payment has been processed successfully</p>

        <div className="bg-secondary/50 rounded-2xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-sm mb-4">Booking details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Duration
              </span>
              <span className="font-medium">{paymentDetails.nights} {paymentDetails.nights === 1 ? "night" : "nights"}</span>
            </div>
            {paymentDetails.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">{format(paymentDetails.startDate, "MMM d, yyyy")}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between font-semibold">
              <span>Amount paid</span>
              <span>${paymentDetails.amount}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          A confirmation email has been sent to your email address.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/account" className="w-full">
            <Button className="w-full" size="lg">
              View your bookings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/listings" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="h-4 w-4" />
              Browse more stays
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
