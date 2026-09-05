import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded pages (critical for initial load)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Listings from "./pages/Listings";

// Lazy-loaded pages (loaded on demand for performance)
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const HostDashboard = lazy(() => import("./pages/HostDashboard"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Messages = lazy(() => import("./pages/Messages"));
const Wishlist = lazy(() => import("./pages/Wishlist"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <div className="flex flex-col min-h-screen">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-lg focus:shadow-lg focus:border focus:border-border"
            >
              Skip to content
            </a>
            <Navbar />

            <main id="main-content" className="flex-grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/listings" element={<Listings />} />
                <Route
                  path="/listing/:id"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ListingDetail />
                    </Suspense>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Account />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Admin />
                    </Suspense>
                  }
                />
                <Route
                  path="/host"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <HostDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <About />
                    </Suspense>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Contact />
                    </Suspense>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Payment />
                    </Suspense>
                  }
                />
                <Route
                  path="/payment-success"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <PaymentSuccess />
                    </Suspense>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Messages />
                    </Suspense>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Wishlist />
                    </Suspense>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ForgotPasswordPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ResetPassword />
                    </Suspense>
                  }
                />
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
