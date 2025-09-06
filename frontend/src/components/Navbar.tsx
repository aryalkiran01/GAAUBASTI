
import { Link } from "react-router-dom";
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
import { LogOut, User, Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <span className="font-serif text-2xl font-bold text-gaun-green">Gaun Basti</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-gaun-green">
            Home
          </Link>
          <Link to="/listings" className="text-sm font-medium hover:text-gaun-green">
            Stay
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-gaun-green">
            About
          </Link>
          <Link to="/contact" className="text-sm font-medium hover:text-gaun-green">
            Contact
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <Link to="/account">Account</Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem>
                    <Link to="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "host" && (
                  <DropdownMenuItem>
                    <Link to="/host">Host Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm" className="bg-gaun-green hover:bg-gaun-light-green">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background py-4">
          <div className="container space-y-4">
            <Link 
              to="/" 
              className="block text-sm font-medium hover:text-gaun-green"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/listings" 
              className="block text-sm font-medium hover:text-gaun-green"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Stay
            </Link>
            <Link 
              to="/about" 
              className="block text-sm font-medium hover:text-gaun-green"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="block text-sm font-medium hover:text-gaun-green"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {user ? (
              <div className="space-y-2 pt-2 border-t">
                <Link 
                  to="/account" 
                  className="flex items-center text-sm font-medium hover:text-gaun-green"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Link>
                {user.role === "admin" && (
                  <Link 
                    to="/admin" 
                    className="flex items-center text-sm font-medium hover:text-gaun-green"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user.role === "host" && (
                  <Link 
                    to="/host" 
                    className="flex items-center text-sm font-medium hover:text-gaun-green"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Host Dashboard
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="flex items-center text-sm font-medium hover:text-gaun-green w-full justify-start p-0"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-gaun-green hover:bg-gaun-light-green">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
