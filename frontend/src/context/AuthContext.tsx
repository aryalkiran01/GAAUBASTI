import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User } from "../types";
import { authAPI, getAuthToken, removeAuthToken } from "../lib/api"; // Import these functions
import { useToast } from "@/components/ui/use-toast";
import { dummyUsers, PASSWORD } from "@/lib/dummy-data";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>; // Fixed signature
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
        const token = getAuthToken();
        
        // Only try to get profile if we have a token
        if (token) {
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.data && response.data.user) {
              setUser(response.data.user);
            }
          } catch (error) {
            console.warn('Profile fetch failed, using demo user:', error);
            // Token might be invalid, remove it
            removeAuthToken();
          }
        }
        
        // Check localStorage for demo user as fallback
        const storedUser = localStorage.getItem('demoUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
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

    } 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      if (response.success) {
        toast({ title: "Password Changed", description: "Your password was updated successfully." });
      }
    } 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
catch (error: any) {
      toast({ variant: "destructive", title: "Change Password Failed", description: error.message || "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        toast({ 
          title: "OTP Sent", 
          description: "Check your email for the OTP code." 
        });
      }
      return response;
    } 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to send OTP" 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(email, otp, newPassword);
      if (response.success) {
        toast({ 
          title: "Success", 
          description: "Password reset successfully." 
        });
      }
      return response;
    } 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to reset password" 
      });
      throw error;
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
    } 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
catch (error: any) {
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
    <AuthContext.Provider value={{ 
      user, isLoading, login, logout, register, 
      changePassword, forgotPassword, resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};