/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, CalendarCheck, AlertCircle } from "lucide-react";

import UserEditDialog from "@/components/admin/UserEditDialog";
import ListingEditDialog from "@/components/admin/ListingEditDialog";
import BookingEditDialog from "@/components/admin/BookingEditDialog";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);

  const [listingFilter, setListingFilter] = useState<"all" | "pending" | "verified">("all");

  const filteredListings = listings.filter((listing) => {
    if (listingFilter === "all") return true;
    if (listingFilter === "pending") return !listing.isVerified;
    if (listingFilter === "verified") return listing.isVerified;
    return true;
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        try {
          const [statsResponse, usersResponse, listingsResponse, bookingsResponse] = await Promise.all([
            adminAPI.getDashboardStats(),
            adminAPI.getAllUsers(),
            adminAPI.getAllListings(),
            adminAPI.getAllBookings({}),
          ]);
          if (statsResponse.success) setDashboardStats(statsResponse.data.stats);
          if (usersResponse.success) setUsers(usersResponse.data.users);
          if (listingsResponse.success) setListings(listingsResponse.data.listings);
          if (bookingsResponse.success) setBookings(bookingsResponse.data.bookings);
        } catch (apiError) {
          console.warn("API not available, using dummy data:", apiError);
          setUsers(dummyUsers);
          setListings(dummyListings);
          setBookings(dummyBookings);
          setDashboardStats({
            totalUsers: dummyUsers.length,
            totalListings: dummyListings.length,
            totalBookings: dummyBookings.length,
            pendingListings: dummyListings.filter((l) => !l.isVerified).length,
          });
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error loading admin data", description: error.message || "Failed to load admin dashboard data" });
        setUsers(dummyUsers);
        setListings(dummyListings);
        setBookings(dummyBookings);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === "admin") fetchAdminData();
  }, [user, toast]);

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/");
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const handleApproveListing = async (listingId: string) => {
    try {
      const response = await adminAPI.verifyListing(listingId, true);
      if (response.success) {
        setListings(listings.map((l) => (l.id === listingId ? { ...l, isVerified: true, verifiedAt: new Date().toISOString() } : l)));
        toast({ title: "Listing approved", description: "The listing has been approved successfully" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Approval failed", description: error.message || "Failed to approve listing" });
    }
  };

  const handleRejectListing = async (listingId: string) => {
    try {
      const response = await adminAPI.verifyListing(listingId, false);
      if (response.success) {
        setListings(listings.map((l) => (l.id === listingId ? { ...l, isVerified: false, verifiedAt: null } : l)));
        toast({ title: "Listing rejected", description: "The listing has been rejected" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Rejection failed", description: error.message || "Failed to reject listing" });
    }
  };

  const handleEditUser = (u: User) => { setSelectedUser(u); setDialogType("user"); };
  const handleEditListing = (l: Listing) => { setSelectedListing(l); setDialogType("listing"); };
  const handleEditBooking = (b: Booking) => { setSelectedBooking(b); setDialogType("booking"); };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedUser(null);
    setSelectedListing(null);
    setSelectedBooking(null);
  };

  const handleSaveUser = (updatedUser: User) => {
    adminAPI.updateUser(updatedUser.id, updatedUser).then(() => {
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      handleCloseDialog();
    }).catch((error) => {
      toast({ variant: "destructive", title: "Update failed", description: error.message || "Failed to update user" });
    });
  };

  const handleSaveListing = (updatedListing: Listing) => {
    adminAPI.verifyListing(updatedListing.id, true).then(() => {
      setListings(listings.map((l) => (l.id === updatedListing.id ? updatedListing : l)));
      handleCloseDialog();
    }).catch((error) => {
      toast({ variant: "destructive", title: "Update failed", description: error.message || "Failed to update listing" });
    });
  };

  const handleSaveBooking = (updatedBooking: Booking) => {
    setBookings(bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
    handleCloseDialog();
  };

  const stats = [
    { label: "Total Users", value: dashboardStats?.totalUsers || users.length, icon: Users },
    { label: "Total Listings", value: dashboardStats?.totalListings || listings.length, icon: Home },
    { label: "Active Bookings", value: dashboardStats?.totalBookings || bookings.filter((b) => b.status === "confirmed").length, icon: CalendarCheck },
    { label: "Pending Listings", value: dashboardStats?.pendingListings || listings.filter((l) => !l.isVerified).length, icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen py-10 md:py-14">
      <div className="container">
        <h1 className="text-3xl font-display font-semibold tracking-tight mb-8">Admin dashboard</h1>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white border border-border rounded-2xl p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-display font-semibold ${stat.label === "Pending Listings" && stat.value > 0 ? "text-amber-600" : ""}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="listings" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.avatar && <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover" />}
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "error" : u.role === "host" ? "default" : "secondary"} className="capitalize">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex gap-2">
                <Button variant={listingFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setListingFilter("all")}>All</Button>
                <Button variant={listingFilter === "pending" ? "default" : "outline"} size="sm" onClick={() => setListingFilter("pending")} className={listingFilter === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}>Pending</Button>
                <Button variant={listingFilter === "verified" ? "default" : "outline"} size="sm" onClick={() => setListingFilter("verified")} className={listingFilter === "verified" ? "bg-success hover:bg-success/90" : ""}>Verified</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={typeof listing.images[0] === "string" ? listing.images[0] : listing.images[0]?.url} alt={listing.title} className="h-8 w-8 rounded-lg object-cover" />
                          <span className="font-medium text-sm">{listing.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {typeof listing.location === "string" ? listing.location : `${listing.location.city}, ${listing.location.country}`}
                      </TableCell>
                      <TableCell className="font-medium">${listing.price}<span className="text-muted-foreground font-normal text-xs">/night</span></TableCell>
                      <TableCell>
                        <Badge variant={listing.isVerified ? "success" : "warning"}>
                          {listing.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{listing.averageRating || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {!listing.isVerified && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleApproveListing(listing.id)} className="bg-success/10 text-success hover:bg-success/20 border-success/30">Approve</Button>
                              <Button variant="outline" size="sm" onClick={() => handleRejectListing(listing.id)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30">Reject</Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditListing(listing)}>Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const listing = typeof booking.listing === "string" ? listings.find((l) => l.id === booking.listing) : booking.listing;
                    const bookingUser = typeof booking.guest === "string" ? users.find((u) => u.id === booking.guest) : booking.guest;
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="text-sm font-medium">{typeof listing === "object" ? listing?.title : "Unknown"}</TableCell>
                        <TableCell className="text-sm">{typeof bookingUser === "object" ? bookingUser?.name : "Unknown"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(booking.startDate, "MMM d")} – {format(booking.endDate, "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">${booking.totalPrice}</TableCell>
                        <TableCell>
                          <Badge variant={booking.status === "confirmed" ? "success" : booking.status === "pending" ? "warning" : booking.status === "cancelled" ? "error" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditBooking(booking)}>Edit</Button>
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
        <UserEditDialog user={selectedUser} isOpen={dialogType === "user"} onClose={handleCloseDialog} onSave={handleSaveUser} />
        <ListingEditDialog listing={selectedListing} isOpen={dialogType === "listing"} onClose={handleCloseDialog} onSave={handleSaveListing} />
        <BookingEditDialog booking={selectedBooking} isOpen={dialogType === "booking"} onClose={handleCloseDialog} onSave={handleSaveBooking} />
      </div>
    </div>
  );
};

export default Admin;
