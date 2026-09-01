import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetails } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";

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
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-display">Invalid payment request</CardTitle>
            <CardDescription>No payment details were provided. Please go back to a listing and make a reservation.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/listings")} className="w-full">Browse listings</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast({ title: "Payment successful", description: `Your payment of $${paymentDetails.amount} has been processed successfully.` });
      navigate("/payment-success", { state: { paymentDetails } });
    }, 2000);
  };

  return (
    <div className="container py-12 md:py-16">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-display font-semibold tracking-tight mb-2">Complete your payment</h1>
        <p className="text-sm text-muted-foreground mb-8">Secure payment for your stay</p>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-sm mb-3">Booking summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{paymentDetails.nights} {paymentDetails.nights === 1 ? "night" : "nights"}</span>
            </div>
            {paymentDetails.startDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">{format(paymentDetails.startDate, "MMM d, yyyy")}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${paymentDetails.amount}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Payment details</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Your payment information is encrypted and secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nameOnCard">Name on card</Label>
                <Input id="nameOnCard" value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} required placeholder="Kiran Aryal" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="cardNumber">Card number</Label>
                <Input id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))} required placeholder="4242 4242 4242 4242" maxLength={16} className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1.5">For demo, enter any 16-digit number</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry date</Label>
                  <Input id="expiryDate" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, "").slice(0, 4))} required placeholder="MMYY" maxLength={4} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))} required placeholder="123" maxLength={3} className="mt-1.5" />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                {isProcessing ? "Processing..." : `Pay $${paymentDetails.amount}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Payments are processed securely. We never store your card details.
        </p>
      </div>
    </div>
  );
};

export default Payment;
