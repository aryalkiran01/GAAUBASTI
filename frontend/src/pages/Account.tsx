
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserBookings } from "@/hooks/useBookings";
import { format } from "date-fns";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { dummyListings } from "@/lib/dummy-data";

const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookings, loading: bookingsLoading, error: bookingsError } = useUserBookings();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Prevent rendering until redirect happens
  }
  
  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-full md:w-1/4">
            <div className="p-6 bg-white border rounded-lg">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-24 w-24 rounded-full overflow-hidden mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gaun-green/20 flex items-center justify-center">
                      <span className="text-2xl font-medium text-gaun-green">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-medium">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Personal Info
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m16 2 5 5-5 5"></path><path d="M21 7H9a5 5 0 0 0-9 3v8a5 5 0 0 0 9 3h12"></path></svg>
                  Payments
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 15"></polyline></svg>
                  History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  Settings
                </Button>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-3/4">
            <h1 className="text-3xl font-serif font-bold mb-6">My Dashboard</h1>
            
            <Tabs defaultValue="bookings" className="w-full">
              <TabsList>
                <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                {user.role === "host" && (
                  <TabsTrigger value="listings">My Listings</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="bookings" className="mt-6">
                <h2 className="text-xl font-medium mb-4">Upcoming Stays</h2>
                
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex flex-col md:flex-row bg-white border rounded-lg overflow-hidden">
                        <Skeleton className="md:w-1/4 h-48 md:h-32" />
                        <div className="p-4 md:p-6 flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookingsError ? (
                  <div className="text-center py-12 border rounded-lg">
                    <p className="text-red-600 mb-4">Error loading bookings: {bookingsError}</p>
                    <Button variant="outline">Try again</Button>
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      // Handle both string and object types for listing
                      const listingData = typeof booking.listing === 'string' 
                        ? dummyListings.find(l => l.id === booking.listing)
                        : booking.listing;
                        
                      return (
                        <div key={booking.id} className="flex flex-col md:flex-row bg-white border rounded-lg overflow-hidden">
                          <div className="md:w-1/4">
                            <img 
                              src={
                                typeof listingData?.images?.[0] === "string"
                                  ? listingData?.images?.[0]
                                  : listingData?.images?.[0]?.url || "https://images.unsplash.com/photo-1587061949409-02df41d5e562"
                              }
                              alt={listingData?.title || "Homestay"}
                              className="h-48 md:h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-4 md:p-6 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium mb-1">{listingData?.title || "Homestay"}</h3>
                                <p className="text-muted-foreground">
                                  {typeof listingData?.location === "string"
                                    ? listingData.location
                                    : listingData?.location
                                      ? `${listingData.location.address}, ${listingData.location.city}${listingData.location.state ? `, ${listingData.location.state}` : ""}, ${listingData.location.country}`
                                      : "Nepal"}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  booking.status === "confirmed" 
                                    ? "bg-green-100 text-green-800" 
                                    : booking.status === "pending" 
                                      ? "bg-yellow-100 text-yellow-800" 
                                      : booking.status === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              <div className="bg-gaun-cream/60 px-3 py-1 rounded-full text-sm">
                                {format(booking.startDate, "MMM d")} – {format(booking.endDate, "MMM d, yyyy")}
                              </div>
                              <div className="bg-gaun-cream/60 px-3 py-1 rounded-full text-sm">
                                {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} nights
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center">
                              <div>
                                <span className="font-medium">${booking.totalPrice}</span> total
                              </div>
                              <div>
                                <Button variant="outline" size="sm" className="mr-2">
                                  View details
                                </Button>
                                <Button variant="outline" size="sm">
                                  Contact host
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-muted-foreground mb-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <h3 className="text-lg font-medium mb-1">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start exploring homestays to plan your next adventure
                    </p>
                    <Button className="bg-gaun-green hover:bg-gaun-light-green">Browse homestays</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="favorites">
                <div className="text-center py-12 border rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-muted-foreground mb-4"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                  <h3 className="text-lg font-medium mb-1">No favorites yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Save homestays you love by clicking the heart icon
                  </p>
                </div>
              </TabsContent>
              
              {user.role === "host" && (
                <TabsContent value="listings">
                  <div className="text-center py-12 border rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-muted-foreground mb-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <h3 className="text-lg font-medium mb-1">Manage your listings</h3>
                    <p className="text-muted-foreground mb-4">
                      You can add new homestays or edit existing ones
                    </p>
                    <Button className="bg-gaun-green hover:bg-gaun-light-green">Add new listing</Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
