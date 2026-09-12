/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Booking, DialogType, Listing, User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  Sparkles,
  Search,
  Eye,
  Edit,
  UserCheck,
  MapPin,
  Home,
  Check,
} from "lucide-react";

// Dialog components
import UserEditDialog from "@/components/admin/UserEditDialog";
import ListingEditDialog from "@/components/admin/ListingEditDialog";
import BookingEditDialog from "@/components/admin/BookingEditDialog";
import AIModeration from "@/components/ai/AIModeration";
import SEO from "@/components/SEO";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState("listings");

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [pendingHosts, setPendingHosts] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [listingFilter, setListingFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [listingSearch, setListingSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "guest" | "host" | "admin">("all");
  const [userSearch, setUserSearch] = useState("");

  // Selected item states for Dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  // Dialog open states
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch admin data
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, usersRes, listingsRes, bookingsRes, pendingHostsRes] = await Promise.all([
        adminAPI.getDashboardStats().catch(() => ({ success: false })),
        adminAPI.getAllUsers().catch(() => ({ success: false })),
        adminAPI.getAllListings().catch(() => ({ success: false })),
        adminAPI.getAllBookings({}).catch(() => ({ success: false })),
        adminAPI.getPendingHosts().catch(() => ({ success: false })),
      ]);

      if (statsRes.success && statsRes.data) {
        setDashboardStats(statsRes.data.stats);
      }

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users || []);
      }

      if (listingsRes.success && listingsRes.data) {
        setListings(listingsRes.data.listings || []);
      }

      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data.bookings || []);
      }

      if (pendingHostsRes.success && pendingHostsRes.data) {
        setPendingHosts(pendingHostsRes.data.users || []);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading admin data",
        description: error.message || "Failed to load admin dashboard data",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null;
  }

  // --- Handlers for Homestay Listing Approvals ---
  const handleApproveListing = async (listingId: string) => {
    try {
      setActionInProgress(listingId);
      const res = await adminAPI.verifyListing(listingId, true);
      if (res.success) {
        setListings((prev) =>
          prev.map((l) =>
            (l._id || l.id) === listingId
              ? { ...l, isVerified: true, status: "approved" as any, verifiedAt: new Date().toISOString() }
              : l
          )
        );
        if (previewListing && (previewListing._id || previewListing.id) === listingId) {
          setPreviewListing({ ...previewListing, isVerified: true, status: "approved" as any });
        }
        toast({
          title: "Homestay Approved",
          description: "The listing is now verified and live on Gaun Basti.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Failed to approve listing",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectListing = async (listingId: string) => {
    try {
      setActionInProgress(listingId);
      const res = await adminAPI.verifyListing(listingId, false);
      if (res.success) {
        setListings((prev) =>
          prev.map((l) =>
            (l._id || l.id) === listingId
              ? { ...l, isVerified: false, status: "rejected" as any, verifiedAt: null as any }
              : l
          )
        );
        if (previewListing && (previewListing._id || previewListing.id) === listingId) {
          setPreviewListing({ ...previewListing, isVerified: false, status: "rejected" as any });
        }
        toast({
          title: "Homestay Rejected",
          description: "The listing status has been set to rejected.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message || "Failed to reject listing",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // --- Handlers for Host Application Approvals ---
  const handleApproveHost = async (hostUserId: string) => {
    try {
      setActionInProgress(hostUserId);
      const res = await adminAPI.approveHost(hostUserId);
      if (res.success) {
        setPendingHosts((prev) => prev.filter((h) => (h.id || (h as any)._id) !== hostUserId));
        setUsers((prev) =>
          prev.map((u) =>
            (u.id || (u as any)._id) === hostUserId
              ? { ...u, role: "host", hostStatus: "approved" }
              : u
          )
        );
        toast({
          title: "Host Approved",
          description: "The applicant has been granted Host privileges.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Host Approval Failed",
        description: error.message || "Failed to approve host application",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectHost = async (hostUserId: string) => {
    const reason = prompt("Enter reason for host application rejection (optional):");
    try {
      setActionInProgress(hostUserId);
      const res = await adminAPI.rejectHost(hostUserId, reason || undefined);
      if (res.success) {
        setPendingHosts((prev) => prev.filter((h) => (h.id || (h as any)._id) !== hostUserId));
        setUsers((prev) =>
          prev.map((u) =>
            (u.id || (u as any)._id) === hostUserId
              ? { ...u, hostStatus: "rejected" }
              : u
          )
        );
        toast({
          title: "Host Application Rejected",
          description: "The application has been marked as rejected.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Host Rejection Failed",
        description: error.message || "Failed to reject host application",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Dialog Controls
  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedUser(null);
    setSelectedListing(null);
    setSelectedBooking(null);
  };

  const handleSaveUser = (updatedUser: User) => {
    const targetId = updatedUser.id || (updatedUser as any)._id;
    adminAPI
      .updateUser(targetId, updatedUser)
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => ((u.id || (u as any)._id) === targetId ? updatedUser : u))
        );
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
    const targetId = updatedListing._id || updatedListing.id;
    adminAPI
      .verifyListing(targetId, updatedListing.isVerified ?? true)
      .then(() => {
        setListings((prev) =>
          prev.map((l) => ((l._id || l.id) === targetId ? updatedListing : l))
        );
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

  // Filtered Listings
  const filteredListings = listings.filter((listing) => {
    const isPending = !listing.isVerified || (listing as any).status === "pending";
    const isVerified = listing.isVerified || (listing as any).status === "approved";
    const isRejected = (listing as any).status === "rejected";

    if (listingFilter === "pending" && !isPending) return false;
    if (listingFilter === "verified" && !isVerified) return false;
    if (listingFilter === "rejected" && !isRejected) return false;

    if (listingSearch.trim()) {
      const q = listingSearch.toLowerCase();
      const titleMatch = listing.title.toLowerCase().includes(q);
      const locStr =
        typeof listing.location === "string"
          ? listing.location.toLowerCase()
          : `${(listing.location as any)?.village || ""} ${(listing.location as any)?.district || ""} ${(listing.location as any)?.city || ""}`.toLowerCase();
      if (!titleMatch && !locStr.includes(q)) return false;
    }

    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingListingCount = listings.filter((l) => !l.isVerified || (l as any).status === "pending").length;
  const pendingHostCount = pendingHosts.length;

  return (
    <div className="min-h-screen bg-background py-10">
      <SEO
        title="Admin Control Center | Gaun Basti"
        description="Manage homestay listing approvals, host applications, user permissions, and platform bookings."
        canonicalPath="/admin"
        noindex
      />

      <div className="container space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gaun-green/10 text-gaun-green text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Management Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Platform Administration
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Review and approve new homestay submissions, verify community host applications, and manage platform data.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAdminData()}
            className="self-start md:self-auto gap-1.5 text-xs"
            disabled={loading}
          >
            <Clock className="h-3.5 w-3.5" />
            Refresh Data
          </Button>
        </div>

        {/* Dashboard Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-card p-5 rounded-2xl border border-border space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Pending Listings */}
            <div
              onClick={() => {
                setActiveTab("listings");
                setListingFilter("pending");
              }}
              className="bg-card hover:bg-amber-500/5 p-5 rounded-2xl border border-border hover:border-amber-400/50 shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Pending Homestays</span>
                <span className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-display font-bold text-amber-600">
                  {pendingListingCount}
                </p>
                {pendingListingCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300">
                    Needs Review
                  </Badge>
                )}
              </div>
            </div>

            {/* 2. Pending Hosts */}
            <div
              onClick={() => setActiveTab("hosts")}
              className="bg-card hover:bg-blue-500/5 p-5 rounded-2xl border border-border hover:border-blue-400/50 shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Host Applications</span>
                <span className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-display font-bold text-blue-600">
                  {pendingHostCount}
                </p>
                {pendingHostCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-300">
                    Pending
                  </Badge>
                )}
              </div>
            </div>

            {/* 3. Total Listings */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Listings</span>
                <span className="h-8 w-8 rounded-full bg-gaun-green/10 text-gaun-green flex items-center justify-center">
                  <Home className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-display font-bold text-foreground">
                  {dashboardStats?.totalListings || listings.length}
                </p>
              </div>
            </div>

            {/* 4. Total Users */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Registered Users</span>
                <span className="h-8 w-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-display font-bold text-foreground">
                  {dashboardStats?.totalUsers || users.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-secondary/60 p-1 rounded-xl h-auto flex flex-wrap gap-1">
            <TabsTrigger value="listings" className="rounded-lg gap-2 text-xs py-2 px-3.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>Homestay Listings</span>
              {pendingListingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingListingCount}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="hosts" className="rounded-lg gap-2 text-xs py-2 px-3.5">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Host Applications</span>
              {pendingHostCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {pendingHostCount}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="users" className="rounded-lg gap-2 text-xs py-2 px-3.5">
              <Users className="h-3.5 w-3.5" />
              <span>Users ({users.length})</span>
            </TabsTrigger>

            <TabsTrigger value="bookings" className="rounded-lg gap-2 text-xs py-2 px-3.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Bookings ({bookings.length})</span>
            </TabsTrigger>

            <TabsTrigger value="moderation" className="rounded-lg gap-2 text-xs py-2 px-3.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Moderation</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB 1: HOMESTAY LISTINGS (APPROVALS & EDITING) */}
          {/* ============================================================ */}
          <TabsContent value="listings" className="space-y-4">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
              {/* Header Controls: Search & Filter Pills */}
              <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={listingFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingFilter("all")}
                    className={`text-xs h-8 ${listingFilter === "all" ? "bg-gaun-green hover:bg-gaun-light-green text-white" : ""}`}
                  >
                    All ({listings.length})
                  </Button>
                  <Button
                    variant={listingFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingFilter("pending")}
                    className={`text-xs h-8 gap-1.5 ${
                      listingFilter === "pending"
                        ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        : "text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Pending Approvals ({pendingListingCount})
                  </Button>
                  <Button
                    variant={listingFilter === "verified" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingFilter("verified")}
                    className={`text-xs h-8 gap-1.5 ${
                      listingFilter === "verified"
                        ? "bg-gaun-green hover:bg-gaun-light-green text-white font-semibold"
                        : "text-green-700 border-green-300 bg-green-50 hover:bg-green-100"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified & Live
                  </Button>
                  <Button
                    variant={listingFilter === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingFilter("rejected")}
                    className="text-xs h-8 text-destructive border-destructive/30"
                  >
                    Rejected
                  </Button>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, village, city..."
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="text-center py-16 p-6 space-y-2">
                    <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h3 className="text-base font-semibold">No homestays found</h3>
                    <p className="text-xs text-muted-foreground">
                      {listingFilter === "pending"
                        ? "All homestay submissions have been reviewed!"
                        : "Try adjusting your filters or search terms."}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[80px]">Photo</TableHead>
                        <TableHead>Homestay Title</TableHead>
                        <TableHead>Village / Location</TableHead>
                        <TableHead>Host Info</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredListings.map((listing) => {
                        const listingId = listing._id || listing.id;
                        const isPending = !listing.isVerified || (listing as any).status === "pending";
                        const isRejected = (listing as any).status === "rejected";
                        const imgUrl =
                          typeof listing.images?.[0] === "string"
                            ? listing.images[0]
                            : listing.images?.[0]?.url ||
                              "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200&auto=format&fit=crop&q=80";

                        const locDisplay =
                          typeof listing.location === "string"
                            ? listing.location
                            : `${(listing.location as any)?.village || (listing.location as any)?.city || "Nepal"}, ${(listing.location as any)?.district || (listing.location as any)?.province || ""}`;

                        const hostObj = listing.host as any;

                        return (
                          <TableRow key={listingId} className="hover:bg-muted/30 transition-colors">
                            {/* Photo Preview */}
                            <TableCell>
                              <img
                                src={imgUrl}
                                alt={listing.title}
                                className="h-11 w-14 rounded-lg object-cover border border-border"
                              />
                            </TableCell>

                            {/* Title */}
                            <TableCell className="max-w-[240px]">
                              <div className="font-semibold text-xs text-foreground line-clamp-1">
                                {listing.title}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {listing.category || "Homestay"} · {listing.bedrooms || 1} Bed · {listing.bathrooms || 1} Bath
                              </div>
                            </TableCell>

                            {/* Location */}
                            <TableCell className="text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3 text-gaun-green shrink-0" />
                                <span className="line-clamp-1">{locDisplay}</span>
                              </span>
                            </TableCell>

                            {/* Host */}
                            <TableCell className="text-xs">
                              <div className="font-medium text-foreground">
                                {hostObj?.name || "Host"}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {hostObj?.email || ""}
                              </div>
                            </TableCell>

                            {/* Price */}
                            <TableCell className="text-xs font-semibold text-gaun-green whitespace-nowrap">
                              Rs. {listing.price?.toLocaleString()}
                              <span className="text-[10px] text-muted-foreground font-normal"> / night</span>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {isPending ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 text-[10px] font-semibold gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  Pending Approval
                                </Badge>
                              ) : isRejected ? (
                                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300 text-[10px] font-semibold gap-1">
                                  <XCircle className="h-2.5 w-2.5" />
                                  Rejected
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gaun-green/10 text-gaun-green border-gaun-green/30 text-[10px] font-semibold gap-1">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  Verified Live
                                </Badge>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Preview Details */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewListing(listing)}
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                  title="Review Full Details"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Review
                                </Button>

                                {/* Approve Button */}
                                {!listing.isVerified && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveListing(listingId)}
                                    disabled={actionInProgress === listingId}
                                    className="h-7 px-2.5 text-xs bg-gaun-green hover:bg-gaun-light-green text-white font-semibold shadow-xs"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Approve
                                  </Button>
                                )}

                                {/* Reject Button */}
                                {listing.isVerified && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectListing(listingId)}
                                    disabled={actionInProgress === listingId}
                                    className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                )}

                                {/* Edit Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedListing(listing);
                                    setDialogType("listing");
                                  }}
                                  className="h-7 px-2 text-xs text-muted-foreground"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: HOST APPLICATIONS (APPROVALS & VERIFICATIONS) */}
          {/* ============================================================ */}
          <TabsContent value="hosts" className="space-y-4">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Community Host Applications</h3>
                  <p className="text-xs text-muted-foreground">
                    Review and verify applicants who want to register and host homestays on Gaun Basti.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-300">
                  {pendingHosts.length} Pending
                </Badge>
              </div>

              {pendingHosts.length === 0 ? (
                <div className="text-center py-16 p-6 space-y-2">
                  <UserCheck className="h-10 w-10 text-gaun-green mx-auto" />
                  <h3 className="text-base font-semibold">No Pending Host Applications</h3>
                  <p className="text-xs text-muted-foreground">
                    All host applications have been reviewed and processed.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingHosts.map((hostUser) => {
                    const hostId = hostUser.id || (hostUser as any)._id;
                    const profile = hostUser.hostProfile;

                    return (
                      <div key={hostId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-4">
                          <img
                            src={hostUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"}
                            alt={hostUser.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-border shadow-xs shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-foreground">{hostUser.name}</h4>
                              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200">
                                Applicant
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {hostUser.email} {hostUser.phone && `· ${hostUser.phone}`}
                            </p>
                            {profile?.bio && (
                              <p className="text-xs text-foreground/90 pt-1 line-clamp-2 italic font-serif">
                                “{profile.bio}”
                              </p>
                            )}
                            {profile?.languages && profile.languages.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {profile.languages.map((lang) => (
                                  <span key={lang} className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground">
                                    {lang}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApproveHost(hostId)}
                            disabled={actionInProgress === hostId}
                            className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs font-semibold gap-1 shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve Host
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectHost(hostId)}
                            disabled={actionInProgress === hostId}
                            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 3: USERS MANAGEMENT */}
          {/* ============================================================ */}
          <TabsContent value="users" className="space-y-4">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Button
                    variant={userRoleFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserRoleFilter("all")}
                    className={`text-xs h-8 ${userRoleFilter === "all" ? "bg-gaun-green text-white" : ""}`}
                  >
                    All Users
                  </Button>
                  <Button
                    variant={userRoleFilter === "host" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserRoleFilter("host")}
                    className={`text-xs h-8 ${userRoleFilter === "host" ? "bg-gaun-green text-white" : ""}`}
                  >
                    Hosts
                  </Button>
                  <Button
                    variant={userRoleFilter === "guest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserRoleFilter("guest")}
                    className={`text-xs h-8 ${userRoleFilter === "guest" ? "bg-gaun-green text-white" : ""}`}
                  >
                    Guests
                  </Button>
                  <Button
                    variant={userRoleFilter === "admin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserRoleFilter("admin")}
                    className={`text-xs h-8 ${userRoleFilter === "admin" ? "bg-gaun-green text-white" : ""}`}
                  >
                    Admins
                  </Button>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Host Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const uId = u.id || (u as any)._id;
                      return (
                        <TableRow key={uId}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border"
                              />
                              <div>
                                <p className="font-semibold text-xs text-foreground">{u.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">@{u.username || "user"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                u.role === "admin"
                                  ? "bg-red-100 text-red-800"
                                  : u.role === "host"
                                  ? "bg-gaun-green/10 text-gaun-green border border-gaun-green/20"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {u.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs capitalize text-muted-foreground">
                              {u.hostStatus || "none"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setDialogType("user");
                              }}
                              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 4: BOOKINGS */}
          {/* ============================================================ */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-sm font-bold">Platform Reservations</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Homestay</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Stay Dates</TableHead>
                      <TableHead>Total (NPR)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => {
                      const bId = b.id || (b as any)._id;
                      const listingObj = typeof b.listing === "object" ? b.listing : listings.find((l) => (l._id || l.id) === b.listing);
                      const guestObj = typeof b.guest === "object" ? b.guest : users.find((u) => (u.id || (u as any)._id) === b.guest);

                      return (
                        <TableRow key={bId}>
                          <TableCell className="text-xs font-semibold text-foreground">
                            {listingObj?.title || "Homestay"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {(guestObj as any)?.name || "Guest"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(b.startDate), "MMM d")} – {format(new Date(b.endDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gaun-green">
                            Rs. {b.totalPrice?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${
                                b.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : b.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(b);
                                setDialogType("booking");
                              }}
                              className="h-7 px-2.5 text-xs text-muted-foreground"
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
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 5: AI MODERATION */}
          {/* ============================================================ */}
          <TabsContent value="moderation" className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs">
              <h3 className="text-base font-semibold mb-2">AI Content Moderation & Verification</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Test and verify listing descriptions, user messages, and guest reviews for community safety and heritage authenticity guidelines.
              </p>
              <AIModeration contentType="listing" content="" />
            </div>
          </TabsContent>
        </Tabs>

        {/* ============================================================ */}
        {/* MODAL: PREVIEW HOMESTAY SUBMISSION DETAILS */}
        {/* ============================================================ */}
        {previewListing && (
          <Dialog open={Boolean(previewListing)} onOpenChange={() => setPreviewListing(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-gaun-green/10 text-gaun-green border-gaun-green/30">
                    {previewListing.category || "Homestay"}
                  </Badge>
                  {previewListing.isVerified ? (
                    <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800">Pending Review</Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-display font-bold">{previewListing.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-3 text-xs">
                {/* Image Gallery Grid */}
                {previewListing.images && previewListing.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden">
                    {previewListing.images.slice(0, 3).map((img, i) => (
                      <div key={i} className="aspect-[4/3] bg-secondary overflow-hidden">
                        <img
                          src={typeof img === "string" ? img : img.url}
                          alt={`preview ${i}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Location & Pricing */}
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3.5 rounded-xl border">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Location</span>
                    <p className="font-semibold text-foreground">
                      {typeof previewListing.location === "string"
                        ? previewListing.location
                        : `${(previewListing.location as any)?.address || ""}, ${(previewListing.location as any)?.village || (previewListing.location as any)?.city || "Nepal"}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Nightly Rate</span>
                    <p className="font-bold text-sm text-gaun-green">
                      Rs. {previewListing.price?.toLocaleString()} NPR
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Description</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {previewListing.description}
                  </p>
                </div>

                {/* Amenities */}
                {previewListing.amenities && previewListing.amenities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1.5">Amenities Included</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {previewListing.amenities.map((amenity) => (
                        <span key={amenity} className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-[11px]">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host Details */}
                {previewListing.host && typeof previewListing.host === "object" && (
                  <div className="border-t pt-3 flex items-center gap-3">
                    <img
                      src={(previewListing.host as any).avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"}
                      alt={(previewListing.host as any).name}
                      className="w-9 h-9 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{(previewListing.host as any).name}</p>
                      <p className="text-muted-foreground text-[11px]">{(previewListing.host as any).email}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setPreviewListing(null)}>
                  Close
                </Button>
                {!previewListing.isVerified ? (
                  <Button
                    onClick={() => handleApproveListing(previewListing._id || previewListing.id)}
                    className="bg-gaun-green hover:bg-gaun-light-green text-white font-semibold"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve & Make Live
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectListing(previewListing._id || previewListing.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Listing
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Existing Edit Dialogs */}
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
          onSave={() => handleCloseDialog()}
        />
      </div>
    </div>
  );
}