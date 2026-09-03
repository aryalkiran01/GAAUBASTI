import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import { authAPI, getAuthToken, removeAuthToken } from "../lib/api";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Updated: register now takes username as first parameter
  register: (
    username: string,
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    otp: string,
    newPassword: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      } catch {
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
          if (response.data.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/account");
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
    } catch (error: unknown) {
      removeAuthToken();
      setUser(null);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    setIsLoading(true);
    try {
      const response = await authAPI.changePassword(
        currentPassword,
        newPassword,
      );
      if (response.success) {
        toast({
          title: "Password Changed",
          description: "Your password was updated successfully.",
        });
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Change Password Failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        toast({
          title: "OTP Sent",
          description: "Check your email for the OTP code.",
        });
      }
      return response;
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string,
  ) => {
    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(email, otp, newPassword);
      if (response.success) {
        toast({
          title: "Success",
          description: "Password reset successfully.",
        });
      }
      return response;
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authAPI.logout();
    } catch {
      // Ignore cleanup errors and continue with local logout.
    }
    setUser(null);
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // ✅ Updated register function: accepts username as first parameter
  const register = async (
    username: string,
    name: string,
    email: string,
    password: string,
  ) => {
    setIsLoading(true);

    try {
      // ✅ Pass username along with other fields
      const response = await authAPI.register(username, name, email, password);

      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
        toast({
          title: "Registration successful",
          description: `Welcome to Gaun Basti, ${response.data.user.name}!`,
        });

        setTimeout(() => {
          navigate("/account");
        }, 1000);
        return;
      }

      removeAuthToken();
      setUser(null);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description:
          response.message || "An error occurred during registration",
      });
    } catch (error: unknown) {
      removeAuthToken();
      setUser(null);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
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
