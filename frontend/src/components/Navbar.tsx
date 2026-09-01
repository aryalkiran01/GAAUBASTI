import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Menu, X, LayoutDashboard, Home as HomeIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isTransparent = isHomePage && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isTransparent
          ? "bg-transparent border-transparent"
          : "bg-background/80 backdrop-blur-md border-b border-border"
      )}
    >
      <div className="container flex h-16 md:h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/gaubasti-logo.png"
              alt="Gau Basti"
              className="w-9 h-9 object-contain"
            />
            <span
              className={cn(
                "font-display text-xl md:text-2xl font-semibold tracking-tight transition-colors",
                isTransparent ? "text-white" : "text-foreground"
              )}
            >
              Gau Basti
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { to: "/", label: "Home" },
            { to: "/listings", label: "Stays" },
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isTransparent
                  ? "text-white/90 hover:text-white"
                  : "text-foreground/80 hover:text-foreground",
                location.pathname === item.to && !isTransparent && "text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 rounded-full p-0.5 pr-3 transition-all hover:bg-secondary/80",
                    isTransparent && "hover:bg-white/15"
                  )}
                >
                  <Avatar className="h-9 w-9 border-2 border-border">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isTransparent ? "text-white" : "text-foreground"
                    )}
                  >
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Account</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "host" && (
                  <DropdownMenuItem asChild>
                    <Link to="/host" className="flex items-center cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Host Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isTransparent && "text-white hover:bg-white/15 hover:text-white"
                  )}
                >
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" variant={isTransparent ? "secondary" : "default"}>
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className={cn("h-5 w-5", isTransparent && "text-white")} />
          ) : (
            <Menu className={cn("h-5 w-5", isTransparent && "text-white")} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-6 space-y-1">
            {[
              { to: "/", label: "Home", icon: HomeIcon },
              { to: "/listings", label: "Stays", icon: null },
              { to: "/about", label: "About", icon: null },
              { to: "/contact", label: "Contact", icon: null },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "block px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-secondary",
                  location.pathname === item.to && "bg-secondary text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-3 mt-3 border-t border-border space-y-2">
              {user ? (
                <>
                  <Link
                    to="/account"
                    className="flex items-center px-3 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
                  >
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="flex items-center px-3 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === "host" && (
                    <Link
                      to="/host"
                      className="flex items-center px-3 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Host Dashboard
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
