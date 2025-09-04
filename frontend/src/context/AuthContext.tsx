import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User } from "../types";
import { authAPI } from "../lib/api";
import { useToast } from "@/components/ui/use-toast";
import { dummyUsers, PASSWORD } from "@/lib/dummy-data";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in by fetching profile
    const initializeAuth = async () => {
      try {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          // Check localStorage for demo user
          const storedUser = localStorage.getItem('demoUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      try {
        const response = await authAPI.login(email, password);
        
        if (response.success) {
          setUser(response.data.user);
          toast({
            title: "Login successful",
            description: `Welcome back, ${response.data.user.name}!`,
          });
          
          // Navigate based on user role
          setTimeout(() => {
            if (response.data.user.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/account';
            }
          }, 1000);
          return;
        }
      } catch (apiError) {
        console.warn('API login failed, trying demo login:', apiError);
      }
      
      // Fallback to demo authentication
      if (password === PASSWORD) {
        const demoUser = dummyUsers.find(u => u.email === email);
        if (demoUser) {
          setUser(demoUser);
          localStorage.setItem('demoUser', JSON.stringify(demoUser));
          toast({
            title: "Demo login successful",
            description: `Welcome back, ${demoUser.name}!`,
          });
          
          // Navigate based on user role
          setTimeout(() => {
            if (demoUser.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/account';
            }
          }, 1000);
          return;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authAPI.logout();
    } catch (error) {
      console.warn('API logout failed:', error);
    }
    localStorage.removeItem('demoUser');
    setUser(null);
    window.location.href = '/';
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      try {
        const response = await authAPI.register(name, email, password);
        
        if (response.success) {
          setUser(response.data.user);
          toast({
            title: "Registration successful",
            description: `Welcome to Gaun Basti, ${response.data.user.name}!`,
          });
          
          // Navigate to account page
          setTimeout(() => {
            window.location.href = '/account';
          }, 1000);
          return;
        }
      } catch (apiError) {
        console.warn('API registration failed, creating demo user:', apiError);
      }
      
      // Fallback to demo registration
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role: 'guest',
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`
      };
      
      setUser(newUser);
      localStorage.setItem('demoUser', JSON.stringify(newUser));
      toast({
        title: "Demo registration successful",
        description: `Welcome to Gaun Basti, ${newUser.name}!`,
      });
      
      // Navigate to account page
      setTimeout(() => {
        window.location.href = '/account';
      }, 1000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};