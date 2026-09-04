/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EmptyState } from "@/components/EmptyState";
import { Home, CalendarCheck, DollarSign, Plus, Pencil, Trash2, MessageSquare, UserCheck, Loader2 } from "lucide-react";
import ListingDescriptionGenerator from "@/components/ai/ListingDescriptionGenerator";
import PricingRecommendation from "@/components/ai/PricingRecommendation";
import { hostVerificationAPI } from "@/lib/api";

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
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isEditingOpen, setIsEditingOpen] = useState(false);

  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [noShowBookingId, setNoShowBookingId] = useState<string | null>(null);
  const [noShowReason, setNoShowReason] = useState("");
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    fullName: "",
    idType: "citizenship",
    idNumber: "",
    address: "",
    phoneNumber: "",
  });
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    location: { address: "", city: "", state: "", country: "Nepal" },
    price: 0,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    category: "homestay",
  });

  useEffect(() => {
    const fetchHostData = async () => {
      try {
        setLoading(true);
        const [listingsResponse, bookingsResponse] = await Promise.all([
          listingsAPI.getHostListings(),
          bookingsAPI.getHostBookings(),
        ]);
        if (listingsResponse.success) setListings(listingsResponse.data.listings);
        if (bookingsResponse.success) setBookings(bookingsResponse.data.bookings);
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

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingListing(true);
    try {
      const response = await listingsAPI.createListing({
        ...newListing,
        images: [{ url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80", caption: "Main view" }],
      });
      if (response.success) {
        setListings([...listings, response.data.listing]);
        setNewListing({ title: "", description: "", location: { address: "", city: "", state: "", country: "Nepal" }, price: 0, maxGuests: 1, bedrooms: 1, bathrooms: 1, amenities: [], category: "homestay" });
        toast({ title: "Listing created", description: "Your new listing has been created successfully" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Creation failed", description: error.message || "Failed to create listing" });
    } finally {
      setIsCreatingListing(false);
    }
  };

  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    try {
      const listingData = {
        title: editingListing.title,
        description: editingListing.description,
        location: editingListing.location,
        price: editingListing.price,
        maxGuests: editingListing.maxGuests,
        bedrooms: editingListing.bedrooms,
        bathrooms: editingListing.bathrooms,
        amenities: editingListing.amenities,
        category: editingListing.category,
      };
      const response = await listingsAPI.updateListing(editingListing.id, listingData);
      if (response.success) {
        setListings(listings.map((l) => (l.id === editingListing.id ? response.data.listing : l)));
        setEditingListing(null);
        setIsEditingOpen(false);
        toast({ title: "Listing updated", description: "Your listing has been updated. It will need to be verified again by admin." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message || "Failed to update listing" });
    }
  };

  const handleDeleteListing = async (listingId: string) => {
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

  const openEditDialog = (listing: Listing) => {
    setEditingListing({ ...listing });
    setIsEditingOpen(true);
  };

  const handleMarkNoShow = async () => {
    if (!noShowBookingId) return;
    setMarkingNoShow(true);
    try {
      const res = await bookingsAPI.markNoShow(noShowBookingId, noShowReason);
      if (res.success) {
        toast({ title: "Guest marked as no-show", description: "The booking has been updated." });
        setNoShowBookingId(null);
        setNoShowReason("");
        const bookingsResponse = await bookingsAPI.getHostBookings();
        if (bookingsResponse.success) setBookings(bookingsResponse.data.bookings);
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Please try again." });
    } finally {
      setMarkingNoShow(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVerification(true);
    try {
      const res = await hostVerificationAPI.submitVerification(verificationForm);
      if (res.success) {
        toast({ title: "Verification submitted", description: "Our team will review your request within 2-3 business days." });
        setVerificationOpen(false);
        setVerificationForm({ fullName: "", idType: "citizenship", idNumber: "", address: "", phoneNumber: "" });
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Please try again." });
    } finally {
      setSubmittingVerification(false);
    }
  };

  const stats = [
    { label: "Total Listings", value: listings.length, icon: Home },
    { label: "Active Bookings", value: bookings.filter((b) => b.status === "confirmed").length, icon: CalendarCheck },
    { label: "Total Revenue", value: `$${bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.totalPrice, 0)}`, icon: DollarSign },
  ];

  return (
    <div className="min-h-screen py-10 md:py-14">
      <SEO title="Host Dashboard" description="Manage your listings, bookings, and reviews." canonicalPath="/host" noindex />
      <div className="container">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-display font-semibold tracking-tight">Host dashboard</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add new listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-display">Create new listing</DialogTitle>
                <DialogDescription>Add a new homestay to your portfolio</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={newListing.title} onChange={(e) => setNewListing({ ...newListing, title: e.target.value })} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per night ($)</Label>
                    <Input id="price" type="number" value={newListing.price} onChange={(e) => setNewListing({ ...newListing, price: Number(e.target.value) })} required className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={newListing.description} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} required rows={3} className="mt-1.5" />
                </div>
                <ListingDescriptionGenerator
                  initialData={{
                    title: newListing.title,
                    category: newListing.category,
                    location: newListing.location.city,
                    amenities: newListing.amenities,
                    bedrooms: newListing.bedrooms,
                    bathrooms: newListing.bathrooms,
                    maxGuests: newListing.maxGuests,
                  }}
                  onApply={(data) => setNewListing((prev) => ({ ...prev, title: data.title, description: data.description }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={newListing.location.city} onChange={(e) => setNewListing({ ...newListing, location: { ...newListing.location, city: e.target.value } })} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={newListing.location.address} onChange={(e) => setNewListing({ ...newListing, location: { ...newListing.location, address: e.target.value } })} required className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxGuests">Max Guests</Label>
                    <Input id="maxGuests" type="number" min="1" value={newListing.maxGuests} onChange={(e) => setNewListing({ ...newListing, maxGuests: Number(e.target.value) })} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input id="bedrooms" type="number" min="0" value={newListing.bedrooms} onChange={(e) => setNewListing({ ...newListing, bedrooms: Number(e.target.value) })} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input id="bathrooms" type="number" min="0" value={newListing.bathrooms} onChange={(e) => setNewListing({ ...newListing, bathrooms: Number(e.target.value) })} required className="mt-1.5" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreatingListing}>
                    {isCreatingListing ? "Creating..." : "Create listing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-semibold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded-xl" />
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={Array.isArray(listing.images) ? (typeof listing.images[0] === "string" ? listing.images[0] : listing.images[0]?.url) : "https://images.unsplash.com/photo-1587061949409-02df41d5e562"}
                              alt={listing.title}
                              loading="lazy"
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                            <div>
                              <p className="font-medium text-sm">{listing.title}</p>
                              <p className="text-xs text-muted-foreground">{listing.bedrooms} bed · {listing.bathrooms} bath</p>
                            </div>
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
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Dialog open={isEditingOpen} onOpenChange={setIsEditingOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(listing)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle className="font-display">Edit listing</DialogTitle>
                                  <DialogDescription>Update your listing details</DialogDescription>
                                </DialogHeader>
                                {editingListing && (
                                  <form onSubmit={handleUpdateListing} className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-title">Title</Label>
                                      <Input id="edit-title" value={editingListing.title} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, title: e.target.value } : null))} required className="mt-1.5" />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea id="edit-description" value={editingListing.description} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, description: e.target.value } : null))} required rows={3} className="mt-1.5" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-city">City</Label>
                                        <Input id="edit-city" value={typeof editingListing.location === "string" ? "" : editingListing.location.city} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, location: typeof prev.location === "string" ? { address: "", city: e.target.value, state: "", country: "Nepal" } : { ...prev.location, city: e.target.value } } : null))} required className="mt-1.5" />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-address">Address</Label>
                                        <Input id="edit-address" value={typeof editingListing.location === "string" ? "" : editingListing.location.address} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, location: typeof prev.location === "string" ? { address: e.target.value, city: "", state: "", country: "Nepal" } : { ...prev.location, address: e.target.value } } : null))} required className="mt-1.5" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                      <div>
                                        <Label htmlFor="edit-maxGuests">Guests</Label>
                                        <Input id="edit-maxGuests" type="number" min="1" value={editingListing.maxGuests} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, maxGuests: Number(e.target.value) } : null))} required className="mt-1.5" />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-bedrooms">Beds</Label>
                                        <Input id="edit-bedrooms" type="number" min="0" value={editingListing.bedrooms} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, bedrooms: Number(e.target.value) } : null))} required className="mt-1.5" />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-bathrooms">Baths</Label>
                                        <Input id="edit-bathrooms" type="number" min="0" value={editingListing.bathrooms} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, bathrooms: Number(e.target.value) } : null))} required className="mt-1.5" />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-price">Price $</Label>
                                        <Input id="edit-price" type="number" value={editingListing.price} onChange={(e) => setEditingListing((prev) => (prev ? { ...prev, price: Number(e.target.value) } : null))} required className="mt-1.5" />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit">Update listing</Button>
                                    </DialogFooter>
                                  </form>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteListing(listing.id)} className="text-destructive hover:bg-destructive/5">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={Home} title="No listings yet" description="Create your first listing to start hosting guests" />
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const guestData = typeof booking.guest === "string" ? { name: "Guest", email: "" } : booking.guest;
                      const listingData = typeof booking.listing === "string" ? listings.find((l) => l.id === booking.listing) : booking.listing;
                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{guestData.name}</p>
                            <p className="text-xs text-muted-foreground">{guestData.email}</p>
                          </TableCell>
                          <TableCell className="text-sm">{listingData?.title || "Unknown"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">${booking.totalPrice}</TableCell>
                          <TableCell>
                            <Badge variant={booking.status === "confirmed" ? "success" : booking.status === "pending" ? "warning" : booking.status === "cancelled" ? "error" : "secondary"}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setBookingStatus(booking.status); setHostNotes(""); }}>
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="font-display">Manage booking</DialogTitle>
                                  <DialogDescription>Update booking status and add notes</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={bookingStatus} onValueChange={setBookingStatus}>
                                      <SelectTrigger className="mt-1.5">
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
                                    <Label htmlFor="hostNotes">Host notes</Label>
                                    <Textarea id="hostNotes" value={hostNotes} onChange={(e) => setHostNotes(e.target.value)} placeholder="Add any notes for the guest..." rows={3} className="mt-1.5" />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdateBookingStatus}>Update booking</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            {booking.status === "confirmed" && new Date(booking.startDate) <= new Date() && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-700 hover:bg-amber-50"
                                onClick={() => setNoShowBookingId(booking.id)}
                              >
                                No-show
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={CalendarCheck} title="No bookings yet" description="Bookings will appear here once guests start reserving your listings" />
              )}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {listings.length > 0 && (
                <PricingRecommendation listingId={listings[0].id} currentPrice={listings[0].price} />
              )}
              <div className="bg-white rounded-2xl border border-border">
                <EmptyState icon={MessageSquare} title="Reviews coming soon" description="Guest reviews for your listings will appear here" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* No-show Dialog */}
      <Dialog open={!!noShowBookingId} onOpenChange={(open) => { if (!open) { setNoShowBookingId(null); setNoShowReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Mark guest as no-show</DialogTitle>
            <DialogDescription>
              This will mark the booking as completed with a no-show note. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="noshow-reason">Reason (optional)</Label>
              <Textarea
                id="noshow-reason"
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                placeholder="e.g. Guest did not arrive, no communication..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoShowBookingId(null)}>Cancel</Button>
            <Button onClick={handleMarkNoShow} disabled={markingNoShow} className="bg-amber-600 hover:bg-amber-700">
              {markingNoShow ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm No-show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Host Verification Dialog */}
      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="fixed bottom-6 right-6 shadow-lg z-50">
            <UserCheck className="h-4 w-4 mr-1.5" />
            Get Verified
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Host Verification</DialogTitle>
            <DialogDescription>
              Submit your details to become a verified host. Verified hosts get a badge and higher booking trust.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitVerification} className="space-y-4">
            <div>
              <Label htmlFor="vf-name">Full legal name</Label>
              <Input id="vf-name" value={verificationForm.fullName} onChange={(e) => setVerificationForm({ ...verificationForm, fullName: e.target.value })} required className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID type</Label>
                <Select value={verificationForm.idType} onValueChange={(v) => setVerificationForm({ ...verificationForm, idType: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizenship">Citizenship</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vf-idnum">ID number</Label>
                <Input id="vf-idnum" value={verificationForm.idNumber} onChange={(e) => setVerificationForm({ ...verificationForm, idNumber: e.target.value })} required className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="vf-address">Address</Label>
              <Input id="vf-address" value={verificationForm.address} onChange={(e) => setVerificationForm({ ...verificationForm, address: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="vf-phone">Phone number</Label>
              <Input id="vf-phone" value={verificationForm.phoneNumber} onChange={(e) => setVerificationForm({ ...verificationForm, phoneNumber: e.target.value })} required className="mt-1.5" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submittingVerification}>
                {submittingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Submit for Verification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostDashboard;
