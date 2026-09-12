/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import {
  Home,
  CalendarCheck,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Percent,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Ban,
  Calendar as CalendarIcon,
} from "lucide-react";
import ListingWizardModal from "@/components/host/ListingWizardModal";

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingStatus, setBookingStatus] = useState("");
  const [hostNotes, setHostNotes] = useState("");

  // 10-Step Wizard Modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  useEffect(() => {
    const fetchHostData = async () => {
      try {
        setLoading(true);
        const [listingsResponse, bookingsResponse] = await Promise.all([
          listingsAPI.getHostListings(),
          bookingsAPI.getHostBookings(),
        ]);
        if (listingsResponse.success) setListings(listingsResponse.data.listings || []);
        if (bookingsResponse.success) setBookings(bookingsResponse.data.bookings || []);
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
    if (user?.role === "host") fetchHostData();
  }, [user, toast]);

  useEffect(() => {
    if (!user || user.role !== "host") navigate("/");
  }, [user, navigate]);

  if (!user || user.role !== "host") return null;

  // Key Analytics Calculations
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingPayouts = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const cancellationRate = bookings.length > 0
    ? Math.round((cancelledBookings.length / bookings.length) * 100)
    : 0;

  const estimatedOccupancy = listings.length > 0
    ? Math.min(100, Math.round((confirmedBookings.length * 4 / (listings.length * 30)) * 100))
    : 0;

  const handleUpdateBookingStatus = async () => {
    if (!selectedBooking || !bookingStatus) return;
    try {
      const response = await bookingsAPI.updateBookingStatus(selectedBooking.id, bookingStatus, hostNotes);
      if (response.success) {
        setBookings(bookings.map((b) => (b.id === selectedBooking.id ? { ...b, status: bookingStatus as any, hostNotes } : b)));
        setSelectedBooking(null);
        setBookingStatus("");
        setHostNotes("");
        toast({ title: "Booking updated", description: "Booking status has been updated successfully" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message || "Failed to update booking status" });
    }
  };

  const handlePublishListing = async (listingId: string) => {
    try {
      const response = await listingsAPI.publishListing(listingId);
      if (response.success) {
        setListings(listings.map((l) => (l.id === listingId ? { ...l, status: 'pending', isVerified: false } as any : l)));
        toast({ title: "Listing submitted", description: "Your listing has been submitted for admin approval." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Publish failed", description: error.message || "Failed to publish listing" });
    }
  };

  const handleUnpublishListing = async (listingId: string) => {
    try {
      const response = await listingsAPI.unpublishListing(listingId);
      if (response.success) {
        setListings(listings.map((l) => (l.id === listingId ? { ...l, status: 'draft', isActive: false } as any : l)));
        toast({ title: "Listing unpublished", description: "Your listing is now offline." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unpublish failed", description: error.message || "Failed to unpublish listing" });
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      const response = await listingsAPI.deleteListing(listingId);
      if (response.success) {
        setListings(listings.filter((l) => l.id !== listingId));
        toast({ title: "Listing deleted", description: "Listing has been deleted successfully" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message || "Failed to delete listing" });
    }
  };

  const openCreateWizard = () => {
    setEditingListing(null);
    setWizardOpen(true);
  };

  const openEditWizard = (listing: Listing) => {
    setEditingListing(listing);
    setWizardOpen(true);
  };

  const handleWizardSuccess = (savedListing: Listing) => {
    setListings((prev) => {
      const exists = prev.some((l) => (l.id || (l as any)._id) === (savedListing.id || (savedListing as any)._id));
      if (exists) {
        return prev.map((l) =>
          (l.id || (l as any)._id) === (savedListing.id || (savedListing as any)._id) ? savedListing : l
        );
      }
      return [savedListing, ...prev];
    });
  };

  return (
    <div className="min-h-screen py-8 md:py-12 bg-background">
      <SEO title="Host Dashboard | Gaun Basti" description="Manage your properties, reservations, earnings, and village homestays." canonicalPath="/host" noindex />

      <div className="container space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Host Management Portal</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Welcome back, {user.name}. Manage your authentic homestay portfolio and incoming guests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/messages">
              <Button variant="outline" size="sm" className="text-xs">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Guest Messages
              </Button>
            </Link>
            <Button onClick={openCreateWizard} size="sm" className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              List New Homestay
            </Button>
          </div>
        </div>

        {/* Host Profile & Verification Status Card */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gaun-green/10 text-gaun-green flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base">{user.name}</h3>
                <Badge variant={user.isVerified ? "default" : "secondary"} className="text-[10px]">
                  {user.isVerified ? "Verified Host" : "Verification Pending"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.hostProfile?.bio || "Certified community homestay host on the Gaun Basti network."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
              <span className="text-muted-foreground">Response Rate: </span>
              <strong className="text-gaun-green">{user.hostProfile?.responseRate || 98}%</strong>
            </div>
            <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
              <span className="text-muted-foreground">Response Time: </span>
              <strong className="text-foreground">{user.hostProfile?.responseTime || "Within 1 hr"}</strong>
            </div>
          </div>
        </div>

        {/* Analytics & Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Listings</CardTitle>
              <Home className="h-4 w-4 text-gaun-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listings.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {listings.filter((l) => l.isActive).length} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active Bookings</CardTitle>
              <CalendarCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedBookings.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {bookings.filter((b) => b.status === "pending").length} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Earned Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Rs. {pendingPayouts.toLocaleString()} in upcoming stays
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Estimated Occupancy</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatedOccupancy}%</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Cancellation Rate: {cancellationRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-secondary/70 p-1">
            <TabsTrigger value="listings" className="text-xs">
              Properties ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs">
              Bookings & Calendar ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs">
              Earnings & Payouts
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROPERTIES */}
          <TabsContent value="listings" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => {
                  const listingId = listing.id || (listing as any)._id;
                  const coverImg = Array.isArray(listing.images) && listing.images[0]
                    ? typeof listing.images[0] === "string"
                      ? listing.images[0]
                      : (listing.images[0] as any).url
                    : "https://images.unsplash.com/photo-1544735716-392fe2489ffa";

                  const locationStr = typeof listing.location === "object"
                    ? `${(listing.location as any).village || (listing.location as any).city}, ${(listing.location as any).district || "Nepal"}`
                    : listing.location;

                  return (
                    <div
                      key={listingId}
                      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                        <img src={coverImg} alt={listing.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <Badge variant={listing.isActive ? "default" : "secondary"} className="text-[10px]">
                            {listing.isActive ? "Active" : "Draft"}
                          </Badge>
                          {listing.isVerified && (
                            <Badge className="bg-gaun-green text-white text-[10px]">Verified</Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-display font-bold text-base leading-snug line-clamp-1">
                              {listing.title}
                            </h3>
                            <span className="font-bold text-gaun-green text-sm">Rs. {listing.price?.toLocaleString()}/night</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{locationStr}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{listing.description}</p>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditWizard(listing)}
                              className="h-7 text-xs px-2.5"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Link to={`/listing/${listingId}`} target="_blank">
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>

                          <div className="flex items-center gap-1">
                            {listing.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnpublishListing(listingId)}
                                className="h-7 text-xs text-amber-600 hover:text-amber-700"
                              >
                                Take Offline
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublishListing(listingId)}
                                className="h-7 text-xs bg-gaun-green/10 text-gaun-green hover:bg-gaun-green hover:text-white"
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteListing(listingId)}
                              className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Home}
                title="No homestays listed yet"
                description="Share your authentic rural accommodation and start receiving guest bookings."
                action={
                  <Button onClick={openCreateWizard} className="bg-gaun-green hover:bg-gaun-light-green text-white">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Your First Listing
                  </Button>
                }
              />
            )}
          </TabsContent>

          {/* TAB 2: BOOKINGS & CALENDAR */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length > 0 ? (
              <div className="border border-border rounded-2xl overflow-x-auto bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Guest / Ref</TableHead>
                      <TableHead className="text-xs">Property</TableHead>
                      <TableHead className="text-xs">Dates</TableHead>
                      <TableHead className="text-xs">Total</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const guestName = typeof booking.guest === "object" ? booking.guest.name : "Traveler";
                      const listingTitle = typeof booking.listing === "object" ? booking.listing.title : "Homestay";
                      const startStr = booking.startDate ? format(new Date(booking.startDate), "MMM d, yyyy") : "-";
                      const endStr = booking.endDate ? format(new Date(booking.endDate), "MMM d, yyyy") : "-";

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="text-xs">
                            <div className="font-semibold text-foreground">{guestName}</div>
                            <span className="text-[10px] text-muted-foreground font-mono">{booking.bookingReference || booking.id.substring(0, 8)}</span>
                          </TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">{listingTitle}</TableCell>
                          <TableCell className="text-xs">{startStr} → {endStr}</TableCell>
                          <TableCell className="text-xs font-bold text-gaun-green">Rs. {booking.totalPrice?.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant={
                                booking.status === "confirmed"
                                  ? "default"
                                  : booking.status === "completed"
                                    ? "secondary"
                                    : booking.status === "pending"
                                      ? "outline"
                                      : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingStatus(booking.status);
                              }}
                              className="h-7 text-xs"
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="No bookings received yet"
                description="When guests reserve your homestay, their reservations and check-in schedules will appear here."
              />
            )}
          </TabsContent>

          {/* TAB 3: EARNINGS & PAYOUTS */}
          <TabsContent value="payouts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Disbursed</CardTitle>
                  <CardDescription className="text-xs">Settled to your verified bank</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gaun-green">${totalRevenue}</div>
                  <p className="text-xs text-muted-foreground mt-2">Zero hidden commission fees on local homestays.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">In Escrow / Upcoming</CardTitle>
                  <CardDescription className="text-xs">Pending guest check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">${pendingPayouts}</div>
                  <p className="text-xs text-muted-foreground mt-2">Released 24 hours following guest arrival.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Direct Bank / eSewa</CardTitle>
                  <CardDescription className="text-xs">Payment distribution status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verified Payout Method Connected</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Payments deposited automatically in NPR (Nepali Rupees).</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 10-Step Wizard Modal */}
        <ListingWizardModal
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          listingToEdit={editingListing}
          onSuccess={handleWizardSuccess}
        />

        {/* Manage Booking Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="font-display">Update Reservation</DialogTitle>
              <DialogDescription className="text-xs">
                Modify status and add host arrival instructions for booking #{selectedBooking?.id.substring(0, 8)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Status</label>
                <Select value={bookingStatus} onValueChange={setBookingStatus}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed (Accept Guest)</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Host Notes / Arrival Instructions</label>
                <Textarea
                  placeholder="e.g. Host family will meet you at the Ghandruk jeep station at 2 PM."
                  value={hostNotes}
                  onChange={(e) => setHostNotes(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={handleUpdateBookingStatus} size="sm" className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs">
                Save Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
