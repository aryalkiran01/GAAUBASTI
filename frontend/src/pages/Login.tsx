import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { PASSWORD } from "@/lib/dummy-data";
import { Mountain, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  const handleDemoLogin = (role: string) => {
    let demoEmail = "";
    switch (role) {
      case "guest":
        demoEmail = "guest@example.com";
        break;
      case "host":
        demoEmail = "host@example.com";
        break;
      case "admin":
        demoEmail = "admin@example.com";
        break;
      default:
        demoEmail = "guest@example.com";
    }
    login(demoEmail, PASSWORD);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Image */}
      <div className="hidden md:block relative">
        <img
          src="https://images.pexels.com/photos/32225790/pexels-photo-32225790.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600"
          alt="Nepal mountains"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-12">
          <div className="text-white">
            <Mountain className="h-8 w-8 mb-4" />
            <h2 className="text-3xl font-display font-semibold leading-tight max-w-xs">
              Discover Nepal, one stay at a time.
            </h2>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Log in to your Gau Basti account
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                  className="mt-1.5"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-xs text-muted-foreground">
                  or try demo accounts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button type="button" variant="outline" onClick={() => handleDemoLogin("guest")} disabled={isLoading}>
                Guest
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDemoLogin("host")} disabled={isLoading}>
                Host
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDemoLogin("admin")} disabled={isLoading}>
                Admin
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
