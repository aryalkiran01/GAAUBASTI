import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("No verification token was provided in the link.");
      return;
    }

    const verify = async () => {
      const response = await authAPI.verifyEmail(token);

      if (response.success) {
        setState("success");
        setTimeout(() => navigate("/account"), 3000);
      } else {
        setState("error");
        setErrorMessage(
          response.message ||
            "Verification link is invalid or expired."
        );
      }
    };

    verify();
  }, [token, navigate]);

  const handleResend = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setResending(true);
    try {
      const response = await authAPI.resendVerification();
      if (response.success) {
        setResent(true);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gaun-cream/30 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gaun-green border-t-transparent" />
            <h1 className="text-2xl font-serif font-bold text-gaun-green mb-2">
              Verifying your email…
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold text-gaun-green mb-2">
              Email Verified!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your email has been confirmed successfully. Redirecting you to your
              account…
            </p>
            <Link to="/account">
              <Button className="bg-gaun-green hover:bg-gaun-light-green">
                Go to Account
              </Button>
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-red-600"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold text-red-600 mb-2">
              Verification Failed
            </h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>

            {user ? (
              resent ? (
                <p className="text-sm text-green-600 mb-4">
                  A new verification link has been sent to your email.
                </p>
              ) : (
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  className="bg-gaun-green hover:bg-gaun-light-green mb-4"
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </Button>
              )
            ) : (
              <Link to="/login">
                <Button className="bg-gaun-green hover:bg-gaun-light-green mb-4">
                  Back to Login
                </Button>
              </Link>
            )}

            <div className="text-sm">
              <Link
                to="/"
                className="text-gaun-green hover:text-gaun-light-green"
              >
                Return to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
