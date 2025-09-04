
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { format } from "date-fns";

const PaymentSuccess = () => {
  const location = useLocation();
  const paymentDetails = location.state?.paymentDetails as PaymentDetails;

  if (!paymentDetails) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Payment Data</CardTitle>
            <CardDescription>
              No payment details were found. Please go back to your bookings.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/account">
              <Button className="w-full">Go to Account</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <CardTitle className="text-2xl">Payment Successful</CardTitle>
          <CardDescription>
            Your booking has been confirmed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gaun-cream/50 rounded-md p-4 mb-6">
            <h3 className="font-semibold mb-2">Booking Details</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {paymentDetails.nights} {paymentDetails.nights === 1 ? "night" : "nights"}
            </p>
            {paymentDetails.startDate && (
              <p className="text-sm text-muted-foreground mb-1">
                Check-in: {format(paymentDetails.startDate, "PPP")}
              </p>
            )}
            <div className="border-t mt-2 pt-2 flex justify-between font-medium">
              <span>Amount Paid</span>
              <span>${paymentDetails.amount}</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            A confirmation email has been sent to your email address.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link to={`/listing/${paymentDetails.listingId}`} className="w-full">
            <Button className="w-full" variant="outline">
              Return to Listing
            </Button>
          </Link>
          <Link to="/account" className="w-full">
            <Button className="w-full bg-gaun-green hover:bg-gaun-light-green">
              View Your Bookings
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
