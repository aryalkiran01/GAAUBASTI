import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { bookingsAPI } from "@/lib/api";

interface StripePaymentFormProps {
  paymentId: string;
  providerPaymentId: string;
  amount: number;
  bookingId?: string;
  onSuccess: () => void;
}

export default function StripePaymentForm({
  paymentId,
  providerPaymentId,
  amount,
  bookingId,
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Failed to submit payment details.");
        setIsProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: providerPaymentId,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setErrorMessage(confirmError.message || "Payment failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      const verificationResponse = await bookingsAPI.verifyPayment(
        paymentId,
        providerPaymentId
      );

      if (!verificationResponse.success) {
        throw new Error(verificationResponse.message || "Payment verification failed");
      }

      toast({
        title: "Payment Successful",
        description: `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
      });

      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to complete payment";
      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {errorMessage && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-gaun-green hover:bg-gaun-light-green"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Payment is secured and verified by Stripe
      </p>

      {bookingId && (
        <p className="sr-only">Booking ID: {bookingId}</p>
      )}
    </form>
  );
}
