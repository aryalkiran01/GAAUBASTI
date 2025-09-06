
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminAPI } from "@/lib/api";
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
import { Booking, DialogType, Listing, User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { dummyUsers, dummyListings, dummyBookings } from "@/lib/dummy-data";

// Import our new dialog components
import UserEditDialog from "@/components/admin/UserEditDialog";
import ListingEditDialog from "@/components/admin/ListingEditDialog";
import BookingEditDialog from "@/components/admin/BookingEditDialog";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Add state for our data
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Selected item states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Dialog open states
  const [dialogType, setDialogType] = useState<DialogType>(null);
  
  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        try {
          const [statsResponse, usersResponse, listingsResponse, bookingsResponse] = await Promise.all([
            adminAPI.getDashboardStats(),
            adminAPI.getAllUsers(),
            adminAPI.getAllListings(),
            adminAPI.getAllBookings({})
          ]);
          
          if (statsResponse.success) {
            setDashboardStats(statsResponse.data.stats);
          }
          
          if (usersResponse.success) {
            setUsers(usersResponse.data.users);
          }
          
          if (listingsResponse.success) {
            setListings(listingsResponse.data.listings);
          }
          
          if (bookingsResponse.success) {
            setBookings(bookingsResponse.data.bookings);
          }
        } catch (apiError) {
          console.warn('API not available, using dummy data:', apiError);
          // Fallback to dummy data
          setUsers(dummyUsers);
          setListings(dummyListings);
          setBookings(dummyBookings);
          setDashboardStats({
            totalUsers: dummyUsers.length,
            totalListings: dummyListings.length,
            totalBookings: dummyBookings.length
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error loading admin data",
          description: error.message || "Failed to load admin dashboard data",
        });
        // Fallback to dummy data on error
        setUsers(dummyUsers);
        setListings(dummyListings);
        setBookings(dummyBookings);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user, toast]);
  
  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null; // Prevent rendering until redirect happens
  }
  
  // Handle open dialog for different entities
  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setDialogType("user");
  };
  
  const handleEditListing = (listingToEdit: Listing) => {
    setSelectedListing(listingToEdit);
    setDialogType("listing");
  };
  
  const handleEditBooking = (bookingToEdit: Booking) => {
    setSelectedBooking(bookingToEdit);
    setDialogType("booking");
  };

  // Handle close dialogs
  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedUser(null);
    setSelectedListing(null);
    setSelectedBooking(null);
  };
  
  // Handle saving updated entities
  const handleSaveUser = (updatedUser: User) => {
    adminAPI.updateUser(updatedUser.id, updatedUser)
      .then(() => {
        const updatedUsers = users.map(u => 
          u.id === updatedUser.id ? updatedUser : u
        );
        setUsers(updatedUsers);
        handleCloseDialog();
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.message || "Failed to update user",
        });
      });
  };
  
  const handleSaveListing = (updatedListing: Listing) => {
    adminAPI.verifyListing(updatedListing.id, true)
      .then(() => {
        const updatedListings = listings.map(l => 
          l.id === updatedListing.id ? updatedListing : l
        );
        setListings(updatedListings);
        handleCloseDialog();
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.message || "Failed to update listing",
        });
      });
  };
  
  const handleSaveBooking = (updatedBooking: Booking) => {
    // Note: This would need a specific admin booking update endpoint
    const updatedBookings = bookings.map(b => 
      b.id === updatedBooking.id ? updatedBooking : b
    );
    setBookings(updatedBookings);
    handleCloseDialog();
  };
  
  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <h1 className="text-3xl font-serif font-bold mb-6">Admin Dashboard</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-muted-foreground mb-1">Total Users</h3>
              <p className="text-4xl font-medium">{dashboardStats?.totalUsers || users.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-muted-foreground mb-1">Total Listings</h3>
              <p className="text-4xl font-medium">{dashboardStats?.totalListings || listings.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-muted-foreground mb-1">Active Bookings</h3>
              <p className="text-4xl font-medium">{dashboardStats?.totalBookings || bookings.filter(b => b.status === "confirmed").length}</p>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <div className="bg-white rounded-md border">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.avatar && (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            )}
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "admin" 
                              ? "bg-red-100 text-red-800" 
                              : user.role === "host" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="listings" className="mt-6">
            <div className="bg-white rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map(listing => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-mono text-sm">{listing.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="h-6 w-6 rounded object-cover"
                          />
                          {listing.title}
                        </div>
                      </TableCell>
                      <TableCell>{listing.location}</TableCell>
                      <TableCell>${listing.price}/night</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-3 h-3 text-yellow-500"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="ml-1">{listing.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditListing(listing)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(booking => {
                    const listing = typeof booking.listing === 'string' 
                      ? listings.find(l => l.id === booking.listing)
                      : booking.listing;
                    const bookingUser = typeof booking.guest === 'string'
                      ? users.find(u => u.id === booking.guest)
                      : booking.guest;
                    
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                        <TableCell>
                          {typeof listing === 'object' ? listing?.title : "Unknown Listing"}
                        </TableCell>
                        <TableCell>
                          {typeof bookingUser === 'object' ? bookingUser?.name : "Unknown User"}
                        </TableCell>
                        <TableCell>
                          {format(booking.startDate, "MMM d")} – {format(booking.endDate, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>${booking.totalPrice}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditBooking(booking)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Dialogs */}
        <UserEditDialog
          user={selectedUser}
          isOpen={dialogType === "user"}
          onClose={handleCloseDialog}
          onSave={handleSaveUser}
        />
        
        <ListingEditDialog
          listing={selectedListing}
          isOpen={dialogType === "listing"}
          onClose={handleCloseDialog}
          onSave={handleSaveListing}
        />
        
        <BookingEditDialog
          booking={selectedBooking}
          isOpen={dialogType === "booking"}
          onClose={handleCloseDialog}
          onSave={handleSaveBooking}
        />
      </div>
    </div>
  );
};

export default Admin;
