import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserBookings } from "@/hooks/useBookings";
import { format } from "date-fns";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { dummyListings } from "@/lib/dummy-data";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { CalendarX, Heart, Hop as Home, MapPin } from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
    case "confirmed": return "success";
    case "pending": return "warning";
    case "cancelled": return "error";
    default: return "secondary";
  }
};

const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookings, loading: bookingsLoading, error: bookingsError } = useUserBookings();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-10 md:py-14">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-72 shrink-0">
            <div className="bg-white border border-border rounded-2xl p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-20 w-20 rounded-full overflow-hidden mb-4 ring-2 ring-border">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-display font-semibold text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-display font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-2 capitalize">{user.role}</Badge>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <h1 className="text-3xl font-display font-semibold tracking-tight mb-6">My dashboard</h1>

            <Tabs defaultValue="bookings" className="w-full">
              <TabsList>
                <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                {user.role === "host" && (
                  <TabsTrigger value="listings">My Listings</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="bookings" className="mt-6">
                <h2 className="text-lg font-medium mb-4">Upcoming stays</h2>

                {bookingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex flex-col md:flex-row bg-white border border-border rounded-2xl overflow-hidden">
                        <Skeleton className="md:w-1/4 h-48 md:h-32" />
                        <div className="p-4 md:p-6 flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookingsError ? (
                  <EmptyState
                    icon={CalendarX}
                    title="Error loading bookings"
                    description={bookingsError}
                    action={<Button variant="outline">Try again</Button>}
                  />
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const listingData = typeof booking.listing === "string"
                        ? dummyListings.find((l) => l.id === booking.listing)
                        : booking.listing;

                      return (
                        <div key={booking.id} className="flex flex-col md:flex-row bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="md:w-1/4 shrink-0">
                            <img
                              src={
                                typeof listingData?.images?.[0] === "string"
                                  ? listingData?.images?.[0]
                                  : listingData?.images?.[0]?.url ||
                                    "https://images.unsplash.com/photo-1587061949409-02df41d5e562"
                              }
                              alt={listingData?.title || "Homestay"}
                              className="h-48 md:h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-4 md:p-6 flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h3 className="font-display font-semibold text-lg mb-1">
                                  {listingData?.title || "Homestay"}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {typeof listingData?.location === "string"
                                    ? listingData.location
                                    : listingData?.location
                                      ? `${listingData.location.city}, ${listingData.location.country}`
                                      : "Nepal"}
                                </p>
                              </div>
                              <Badge variant={statusVariant(booking.status) as any}>
                                {booking.status}
                              </Badge>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <div className="bg-secondary/60 px-3 py-1 rounded-full text-xs font-medium">
                                {format(booking.startDate, "MMM d")} – {format(booking.endDate, "MMM d, yyyy")}
                              </div>
                              <div className="bg-secondary/60 px-3 py-1 rounded-full text-xs font-medium">
                                {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} nights
                              </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-semibold">${booking.totalPrice}</span>
                                <span className="text-muted-foreground"> total</span>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">View details</Button>
                                <Button variant="ghost" size="sm">Contact host</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarX}
                    title="No bookings yet"
                    description="Start exploring homestays to plan your next adventure"
                    action={
                      <Link to="/listings">
                        <Button>Browse homestays</Button>
                      </Link>
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="favorites" className="mt-6">
                <EmptyState
                  icon={Heart}
                  title="No favorites yet"
                  description="Save homestays you love by clicking the heart icon"
                />
              </TabsContent>

              {user.role === "host" && (
                <TabsContent value="listings" className="mt-6">
                  <EmptyState
                    icon={Home}
                    title="Manage your listings"
                    description="You can add new homestays or edit existing ones"
                    action={
                      <Link to="/host">
                        <Button>Add new listing</Button>
                      </Link>
                    }
                  />
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
