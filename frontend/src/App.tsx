import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import HostDashboard from "./pages/HostDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Messages from "./pages/Messages";
import Wishlist from "./pages/Wishlist";
import HelpCenter from "./pages/HelpCenter";
import SupportTickets from "./pages/SupportTickets";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/account" element={<Account />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/host" element={<HostDashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/support" element={<SupportTickets />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
 