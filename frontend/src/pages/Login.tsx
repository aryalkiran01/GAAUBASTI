
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { PASSWORD } from "@/lib/dummy-data";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    
    // Note: In a real app, you'd wait for login success before redirecting
    // For demo purposes, we'll navigate after successful authentication
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
    <div className="min-h-screen flex items-center justify-center bg-gaun-cream/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-gaun-green">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to your Gaun Basti account
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
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-gaun-green hover:text-gaun-light-green"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            {isLoading ? "Logging in..." : "Log in"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-muted-foreground">or try demo accounts</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleDemoLogin("guest")}
              disabled={isLoading}
            >
              Guest
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleDemoLogin("host")}
              disabled={isLoading}
            >
              Host
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleDemoLogin("admin")}
              disabled={isLoading}
            >
              Admin
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account?</span>{" "}
            <Link
              to="/signup"
              className="text-gaun-green hover:text-gaun-light-green"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
