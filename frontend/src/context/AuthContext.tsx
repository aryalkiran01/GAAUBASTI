import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User } from "../types";
import { authAPI, getAuthToken, removeAuthToken } from "../lib/api"; 
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();

        if (!token) {
          setUser(null);
          return;
        }

        const response = await authAPI.getProfile();
        if (response.success && response.data && response.data.user) {
          setUser(response.data.user);
        } else {
          removeAuthToken();
          setUser(null);
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        removeAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
   setIsLoading(true);

   try {
     const response = await authAPI.login(email, password);

     if (response.success && response.data && response.data.user) {
       setUser(response.data.user);
       toast({
         title: "Login successful",
         description: `Welcome back, ${response.data.user.name}!`,
       });

       setTimeout(() => {
         if (response.data.user.role === 'admin') {
           window.location.href = '/admin';
         } else {
           window.location.href = '/account';
         }
       }, 1000);
       return;
     }

     removeAuthToken();
     setUser(null);
     toast({
       variant: "destructive",
       title: "Login failed",
       description: response.message || "Invalid email or password",
     });
   }
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
   catch (error: any) {
     removeAuthToken();
     setUser(null);
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
     const response = await authAPI.register(name, email, password);

     if (response.success && response.data && response.data.user) {
       setUser(response.data.user);
       toast({
         title: "Registration successful",
         description: `Welcome to Gaun Basti, ${response.data.user.name}!`,
       });

       setTimeout(() => {
         window.location.href = '/account';
       }, 1000);
       return;
     }

     removeAuthToken();
     setUser(null);
     toast({
       variant: "destructive",
       title: "Registration failed",
       description: response.message || "An error occurred during registration",
     });
   }
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
   catch (error: any) {
     removeAuthToken();
     setUser(null);
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