import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, Mail, Home } from "lucide-react";
import SEO from "@/components/SEO";
import { useToast } from "@/components/ui/use-toast";

type VerificationStatus = "loading" | "success" | "expired" | "invalid" | "already_verified";

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token) {
        setStatus("invalid");
        setErrorMessage("Verification token is missing from the link.");
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);

        if (!isMounted) return;

        if (response.success) {
          setStatus("success");
          toast({
            title: "Email Verified!",
            description: "Your email address has been successfully verified.",
          });
        } else {
          const msg = (response.message || "").toLowerCase();
          if (msg.includes("already") || msg.includes("previously")) {
            setStatus("already_verified");
          } else if (msg.includes("expired")) {
            setStatus("expired");
            setErrorMessage(response.message || "This verification link has expired.");
          } else {
            setStatus("invalid");
            setErrorMessage(response.message || "Invalid verification link.");
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus("invalid");
        setErrorMessage("An unexpected error occurred while verifying your email.");
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, toast]);

  // Auto-redirect to login after success
  useEffect(() => {
    if (status !== "success" && status !== "already_verified") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await authAPI.resendVerification();
      if (response.success) {
        toast({
          title: "Verification Email Sent",
          description: "A fresh verification link has been sent to your inbox.",
        });
      } else {
        toast({
          title: "Could Not Resend",
          description: response.message || "Please log in first or try again later.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend verification link. Please log in to request a new link.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <SEO
        title="Verify Email - Gau Basti"
        description="Verify your email address to activate your Gau Basti account."
      />

      <Card className="w-full max-w-md shadow-xl border-border/60 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
            {status === "already_verified" && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
            {status === "expired" && <AlertCircle className="h-8 w-8 text-amber-500" />}
            {status === "invalid" && <XCircle className="h-8 w-8 text-destructive" />}
          </div>

          <CardTitle className="text-2xl font-display font-semibold tracking-tight">
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Email Verified!"}
            {status === "already_verified" && "Already Verified"}
            {status === "expired" && "Link Expired"}
            {status === "invalid" && "Invalid Link"}
          </CardTitle>

          <CardDescription className="text-sm mt-2">
            {status === "loading" && "Please wait a moment while we verify your credentials."}
            {status === "success" && "Your Gau Basti account is now fully activated."}
            {status === "already_verified" && "Your email address has already been verified."}
            {status === "expired" && errorMessage}
            {status === "invalid" && errorMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          {(status === "success" || status === "already_verified") && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              Redirecting you to login in <span className="font-semibold">{countdown}</span> seconds...
            </div>
          )}

          {status === "expired" && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-800 dark:text-amber-300 text-left space-y-2">
              <p>Verification links are valid for 24 hours for your security.</p>
              <p>You can request a new verification link below.</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive text-left">
              The link you followed may be corrupted or has already been used. Please ensure you clicked the latest link in your email.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          {(status === "success" || status === "already_verified") && (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => navigate("/login")}
            >
              <span>Go to Login</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {status === "expired" && (
            <>
              <Button
                className="w-full gap-2"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                <span>Resend Verification Email</span>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </>
          )}

          {status === "invalid" && (
            <>
              <Button className="w-full" asChild>
                <Link to="/signup">Create New Account</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </>
          )}

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
