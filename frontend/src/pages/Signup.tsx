import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Mountain } from "lucide-react";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass username as the first argument (or adjust to match AuthContext)
    register(username, name, email, password);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <SEO title="Sign up" description="Create a Gau Basti account to discover and book authentic Nepali homestays." canonicalPath="/signup" noindex />
      {/* Left: Image */}
      <div className="hidden md:block relative">
        <img
          src="https://images.pexels.com/photos/8220089/pexels-photo-8220089.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600"
          alt="Nepal rice terraces"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-12">
          <div className="text-white">
            <Mountain className="h-8 w-8 mb-4" />
            <h2 className="text-3xl font-display font-semibold leading-tight max-w-xs">
              Your Nepal adventure starts here.
            </h2>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Join Gau Basti to discover authentic Nepali homestays
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* NEW: Username field */}
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kiran_dai"
                  required
                  pattern="[A-Za-z0-9]+" // enforce alphanumeric
                  title="Alphanumeric characters only"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Alphanumeric only (letters and numbers)
                </p>
              </div>

              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kiran Dai"
                  required
                  className="mt-1.5"
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Must be at least 6 characters
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
