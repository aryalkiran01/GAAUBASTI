import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "../lib/api"; 

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use the API function directly since it's not available in AuthContext
      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        setIsSubmitted(true);
        toast({
          title: "OTP Sent",
          description: "Check your email for the OTP code to reset your password.",
        });
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gaun-cream/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gaun-green">Check Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a 6-digit OTP to <strong>{email}</strong>. 
            Use it to reset your password.
          </p>
          <div className="pt-4">
            <Link to="/reset-password">
              <Button className="bg-gaun-green hover:bg-gaun-light-green">
                Reset Password
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?{" "}
            <button 
              onClick={() => setIsSubmitted(false)}
              className="text-gaun-green hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gaun-cream/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-gaun-green">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to receive a verification code
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gaun-green hover:bg-gaun-light-green"
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Remember your password?</span>{" "}
            <Link
              to="/login"
              className="text-gaun-green hover:text-gaun-light-green"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;