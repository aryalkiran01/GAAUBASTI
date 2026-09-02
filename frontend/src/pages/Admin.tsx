/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminAPI, reportsAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Flag, FileText, ShieldAlert } from "lucide-react";
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
  
  // Filter state for listings
  const [listingFilter, setListingFilter] = useState<'all' | 'pending' | 'verified'>('all');

  // Reports and audit logs state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Filtered listings based on selection
  const filteredListings = listings.filter(listing => {
    if (listingFilter === 'all') return true;
    if (listingFilter === 'pending') return !listing.isVerified;
    if (listingFilter === 'verified') return listing.isVerified;
    return true;
  });

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
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
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error loading admin data",
          description: error.message || "Failed to load admin dashboard data",
        });
        setUsers([]);
        setListings([]);
        setBookings([]);
        setDashboardStats({
          totalUsers: 0,
          totalListings: 0,
          totalBookings: 0,
          pendingListings: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user, toast]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const response = await adminAPI.getReports();
      if (response.success) setReports(response.data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchFlaggedReviews = async () => {
    setFlaggedLoading(true);
    try {
      const response = await adminAPI.getFlaggedReviews();
      if (response.success) setFlaggedReviews(response.data.reviews || []);
    } catch {
      setFlaggedReviews([]);
    } finally {
      setFlaggedLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const response = await adminAPI.getAuditLogs({ limit: 50 });
      if (response.success) setAuditLogs(response.data.logs || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleReportStatus = async (reportId: string, status: string) => {
    try {
      const response = await adminAPI.updateReportStatus(reportId, status);
      if (response.success) {
        setReports(reports.map(r => r._id === reportId || r.id === reportId ? { ...r, status } : r));
        toast({ title: "Report updated", description: `Status set to ${status}` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    }
  };

  const handleModerateReview = async (reviewId: string, action: "approve" | "remove") => {
    try {
      const response = await adminAPI.moderateReview(reviewId, action);
      if (response.success) {
        setFlaggedReviews(flaggedReviews.filter(r => r._id !== reviewId && r.id !== reviewId));
        toast({ title: action === "approve" ? "Review approved" : "Review removed" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action failed", description: error.message });
    }
  };
  
  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null; // Prevent rendering until redirect happens
  }
  
  // Handle listing approval
  const handleApproveListing = async (listingId: string) => {
    try {
      const response = await adminAPI.verifyListing(listingId, true);
      if (response.success) {
        setListings(listings.map(listing => 
          listing.id === listingId 
            ? { ...listing, isVerified: true, verifiedAt: new Date().toISOString() }
            : listing
        ));
        toast({
          title: "Listing Approved",
          description: "The listing has been approved successfully",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Failed to approve listing",
      });
    }
  };

  // Handle listing rejection
  const handleRejectListing = async (listingId: string) => {
    try {
      const response = await adminAPI.verifyListing(listingId, false);
      if (response.success) {
        setListings(listings.map(listing => 
          listing.id === listingId 
            ? { ...listing, isVerified: false, verifiedAt: null }
            : listing
        ));
        toast({
          title: "Listing Rejected",
          description: "The listing has been rejected",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message || "Failed to reject listing",
      });
    }
  };
  
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-muted-foreground mb-1">Pending Listings</h3>
              <p className="text-4xl font-medium text-amber-600">
                {dashboardStats?.pendingListings || listings.filter(l => !l.isVerified).length}
              </p>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="listings" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reports" onClick={fetchReports}>Reports</TabsTrigger>
            <TabsTrigger value="flagged" onClick={fetchFlaggedReviews}>Flagged Reviews</TabsTrigger>
            <TabsTrigger value="audit" onClick={fetchAuditLogs}>Audit Logs</TabsTrigger>
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
              {/* Listing Filter Controls */}
              <div className="p-4 border-b">
                <div className="flex space-x-2">
                  <Button
                    variant={listingFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setListingFilter('all')}
                  >
                    All Listings
                  </Button>
                  <Button
                    variant={listingFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setListingFilter('pending')}
                    className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                  >
                    Pending Approval
                  </Button>
                  <Button
                    variant={listingFilter === 'verified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setListingFilter('verified')}
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    Verified
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map(listing => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-mono text-sm">{listing.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={typeof listing.images[0] === "string" ? listing.images[0] : listing.images[0]?.url}
                            alt={listing.title}
                            className="h-6 w-6 rounded object-cover"
                          />
                          {listing.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {typeof listing.location === "string"
                          ? listing.location
                          : listing.location
                          ? `${listing.location.address}, ${listing.location.city}${listing.location.state ? ", " + listing.location.state : ""}, ${listing.location.country}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>${listing.price}/night</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          listing.isVerified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {listing.isVerified ? "Verified" : "Pending"}
                        </span>
                      </TableCell>
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
                          <span className="ml-1">{listing.averageRating || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!listing.isVerified && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleApproveListing(listing.id)}
                                className="bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRejectListing(listing.id)}
                                className="bg-red-100 text-red-800 hover:bg-red-200"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditListing(listing)}
                          >
                            Edit
                          </Button>
                        </div>
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
          <TabsContent value="reports" className="mt-6">
            <div className="bg-white rounded-md border">
              {reportsLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report._id || report.id}>
                        <TableCell className="capitalize">{report.reportedEntityType}</TableCell>
                        <TableCell className="font-mono text-xs">{(report.reportedEntityId || "").slice(0, 8)}...</TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>{report.reporter?.name || "Unknown"}</TableCell>
                        <TableCell>{format(new Date(report.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            report.status === "resolved" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {report.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleReportStatus(report._id || report.id, "resolved")}>
                              Resolve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleReportStatus(report._id || report.id, "dismissed")}>
                              Dismiss
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <ShieldAlert className="mx-auto h-10 w-10 mb-3 text-muted-foreground/50" />
                  No reports submitted.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="flagged" className="mt-6">
            <div className="bg-white rounded-md border">
              {flaggedLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : flaggedReviews.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedReviews.map((review) => (
                      <TableRow key={review._id || review.id}>
                        <TableCell>{review.guest?.name || "Unknown"}</TableCell>
                        <TableCell>{review.rating}/5</TableCell>
                        <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{review.flagCount || 1}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(review.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="bg-green-100 text-green-800 hover:bg-green-200" onClick={() => handleModerateReview(review._id || review.id, "approve")}>
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" className="bg-red-100 text-red-800 hover:bg-red-200" onClick={() => handleModerateReview(review._id || review.id, "remove")}>
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Flag className="mx-auto h-10 w-10 mb-3 text-muted-foreground/50" />
                  No flagged reviews.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <div className="bg-white rounded-md border">
              {auditLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log._id || log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.user?.name || log.user?.email || "System"}</TableCell>
                        <TableCell className="text-muted-foreground">{log.resource || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ip || "-"}</TableCell>
                        <TableCell>{format(new Date(log.createdAt || log.timestamp), "MMM d, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="mx-auto h-10 w-10 mb-3 text-muted-foreground/50" />
                  No audit logs recorded.
                </div>
              )}
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