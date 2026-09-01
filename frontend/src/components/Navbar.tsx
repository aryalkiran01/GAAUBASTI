
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useNavigate } from "react-router-dom";
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
import { LogOut, User, Menu, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationsAPI } from "@/lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const response = await notificationsAPI.list();
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount || 0);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationClick = async (notification: any) => {
    if (notification?._id) {
      await notificationsAPI.markRead(notification._id);
    }

    const payload = notification?.content || {};
    if (payload.conversationId) {
      navigate(`/messages?conversationId=${payload.conversationId}`);
      return;
    }

    navigate("/account");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
          <img
    src="/gaubasti-logo.png" 
    alt="Gaubasti Logo"
    className="w-12 h-12 object-contain"
  />

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
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
                  <div className="px-2 py-1 text-sm font-medium">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <DropdownMenuItem
                        key={notification._id || notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="flex flex-col items-start gap-1 whitespace-normal"
                      >
                        <span className="font-medium">{notification.type || "Update"}</span>
                        <span className="text-xs text-muted-foreground">
                          {notification.content?.preview || notification.content?.message || "New update"}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    View all updates
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/messages">
                <Button variant="outline" size="sm">Messages</Button>
              </Link>

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
            </div>
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
