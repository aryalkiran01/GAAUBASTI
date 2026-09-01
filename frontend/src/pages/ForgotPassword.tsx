import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "../lib/api";
import { Mail, CircleCheck as CheckCircle2, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
        <div className="max-w-sm w-full space-y-6 text-center">
          <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit OTP to <strong>{email}</strong>. Use it to reset your password.
            </p>
          </div>
          <Link to="/reset-password">
            <Button className="w-full">Reset password</Button>
          </Link>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-sm w-full space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a verification code
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">Email address</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
