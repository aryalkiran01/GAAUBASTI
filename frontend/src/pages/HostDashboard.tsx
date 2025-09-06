import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listingsAPI, bookingsAPI } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Booking, Listing } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HostDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingStatus, setBookingStatus] = useState("");
  const [hostNotes, setHostNotes] = useState("");
  
  // New listing form state
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    location: { address: "", city: "", state: "", country: "Nepal" },
    price: 0,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    category: "homestay"
  });

  // Fetch host data
  useEffect(() => {
    const fetchHostData = async () => {
      try {
        setLoading(true);
        
        const [listingsResponse, bookingsResponse] = await Promise.all([
          listingsAPI.getHostListings(),
          bookingsAPI.getHostBookings()
        ]);
        
        if (listingsResponse.success) {
          setListings(listingsResponse.data.listings);
        }
        
        if (bookingsResponse.success) {
          setBookings(bookingsResponse.data.bookings);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error loading dashboard data",
          description: error.message || "Failed to load host dashboard data",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === "host") {
      fetchHostData();
    }
  }, [user, toast]);
  
  // Redirect if not host
  useEffect(() => {
    if (!user || user.role !== "host") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "host") {
    return null;
  }

  const handleUpdateBookingStatus = async () => {
    if (!selectedBooking || !bookingStatus) return;
    
    try {
      const response = await bookingsAPI.updateBookingStatus(
        selectedBooking.id, 
        bookingStatus, 
        hostNotes
      );
      
      if (response.success) {
        setBookings(bookings.map(b => 
          b.id === selectedBooking.id 
            ? { ...b, status: bookingStatus as any, hostNotes }
            : b
        ));
        setSelectedBooking(null);
        setBookingStatus("");
        setHostNotes("");
        toast({
          title: "Booking updated",
          description: "Booking status has been updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update booking status",
      });
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingListing(true);
    
    try {
      const response = await listingsAPI.createListing({
        ...newListing,
        images: [
          {
            url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            caption: "Main view"
          }
        ]
      });
      
      if (response.success) {
        setListings([...listings, response.data.listing]);
        setNewListing({
          title: "",
          description: "",
          location: { address: "", city: "", state: "", country: "Nepal" },
          price: 0,
          maxGuests: 1,
          bedrooms: 1,
          bathrooms: 1,
          amenities: [],
          category: "homestay"
        });
        toast({
          title: "Listing created",
          description: "Your new listing has been created successfully",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error.message || "Failed to create listing",
      });
    } finally {
      setIsCreatingListing(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      const response = await listingsAPI.deleteListing(listingId);
      
      if (response.success) {
        setListings(listings.filter(l => l.id !== listingId));
        toast({
          title: "Listing deleted",
          description: "Listing has been deleted successfully",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete listing",
      });
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold">Host Dashboard</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gaun-green hover:bg-gaun-light-green">
                Add New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
                <DialogDescription>
                  Add a new homestay to your portfolio
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newListing.title}
                      onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per night ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newListing.price}
                      onChange={(e) => setNewListing({...newListing, price: Number(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newListing.description}
                    onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                    required
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newListing.location.city}
                      onChange={(e) => setNewListing({
                        ...newListing, 
                        location: {...newListing.location, city: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newListing.location.address}
                      onChange={(e) => setNewListing({
                        ...newListing, 
                        location: {...newListing.location, address: e.target.value}
                      })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxGuests">Max Guests</Label>
                    <Input
                      id="maxGuests"
                      type="number"
                      min="1"
                      value={newListing.maxGuests}
                      onChange={(e) => setNewListing({...newListing, maxGuests: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={newListing.bedrooms}
                      onChange={(e) => setNewListing({...newListing, bedrooms: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={newListing.bathrooms}
                      onChange={(e) => setNewListing({...newListing, bathrooms: Number(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={isCreatingListing}>
                    {isCreatingListing ? "Creating..." : "Create Listing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter(b => b.status === "confirmed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + b.totalPrice, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="listings" className="w-full">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="listings" className="mt-6">
            <div className="bg-white rounded-md border">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : listings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map(listing => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={Array.isArray(listing.images) ? 
                                (typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0]?.url) :
                                "https://images.unsplash.com/photo-1587061949409-02df41d5e562"
                              }
                              alt={listing.title}
                              className="h-12 w-12 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium">{listing.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {listing.bedrooms} bed • {listing.bathrooms} bath
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {typeof listing.location === 'string' ? 
                            listing.location : 
                            `${listing.location.city}, ${listing.location.country}`
                          }
                        </TableCell>
                        <TableCell>${listing.price}/night</TableCell>
                        <TableCell>
                          <Badge variant={listing.isVerified ? "default" : "secondary"}>
                            {listing.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteListing(listing.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first listing to start hosting guests
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-md border">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Listing</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(booking => {
                      const guestData = typeof booking.guest === 'string' 
                        ? { name: "Guest", email: "" }
                        : booking.guest;
                      const listingData = typeof booking.listing === 'string'
                        ? listings.find(l => l.id === booking.listing)
                        : booking.listing;
                        
                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{guestData.name}</p>
                              <p className="text-sm text-muted-foreground">{guestData.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {listingData?.title || "Unknown Listing"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>${booking.totalPrice}</TableCell>
                          <TableCell>
                            <Badge variant={
                              booking.status === "confirmed" ? "default" :
                              booking.status === "pending" ? "secondary" :
                              booking.status === "cancelled" ? "destructive" :
                              "outline"
                            }>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setBookingStatus(booking.status);
                                    setHostNotes("");
                                  }}
                                >
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage Booking</DialogTitle>
                                  <DialogDescription>
                                    Update booking status and add notes
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={bookingStatus} onValueChange={setBookingStatus}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="hostNotes">Host Notes</Label>
                                    <Textarea
                                      id="hostNotes"
                                      value={hostNotes}
                                      onChange={(e) => setHostNotes(e.target.value)}
                                      placeholder="Add any notes for the guest..."
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdateBookingStatus}>
                                    Update Booking
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground">
                    Bookings will appear here once guests start reserving your listings
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Reviews coming soon</h3>
              <p className="text-muted-foreground">
                Guest reviews for your listings will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HostDashboard;