
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const paymentDetails = location.state?.paymentDetails as PaymentDetails;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Successful",
        description: `Your payment of $${paymentDetails.amount} has been processed successfully.`,
      });
      navigate("/payment-success", { state: { paymentDetails } });
    }, 2000);
  };

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
            <CardDescription>
              Secure payment for your stay
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
                <div className="space-y-2">
                  <Label htmlFor="nameOnCard">Name on Card</Label>
                  <Input 
                    id="nameOnCard"
                    value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value)}
                    required
                    placeholder="John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input 
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    required
                    placeholder="4242 4242 4242 4242"
                    maxLength={16}
                  />
                  <p className="text-xs text-muted-foreground">
                    For demo, you can enter any 16-digit number
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input 
                      id="expiryDate"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      required
                      placeholder="MMYY"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input 
                      id="cvc"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      required
                      placeholder="123"
                      maxLength={3}
                    />
                  </div>
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
