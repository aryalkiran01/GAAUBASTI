/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Listing } from "@/types";
import { listingsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Home,
  MapPin,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ListCheck,
} from "lucide-react";
import ListingDescriptionGenerator from "@/components/ai/ListingDescriptionGenerator";
import PricingRecommendation from "@/components/ai/PricingRecommendation";

const WIZARD_STEPS = [
  { step: 1, title: "Basics", icon: Home },
  { step: 2, title: "Location", icon: MapPin },
  { step: 3, title: "Photos", icon: ImageIcon },
  { step: 4, title: "Amenities", icon: Sparkles },
  { step: 5, title: "House Rules", icon: ListCheck },
  { step: 6, title: "Pricing", icon: DollarSign },
  { step: 7, title: "Availability", icon: Calendar },
  { step: 8, title: "Safety & Care", icon: ShieldCheck },
  { step: 9, title: "Preview", icon: Eye },
  { step: 10, title: "Publish", icon: CheckCircle2 },
];

const AMENITY_OPTIONS = [
  "WiFi",
  "Hot Water",
  "Kitchen",
  "Parking",
  "Mountain View",
  "Organic Meals",
  "Campfire",
  "Heating",
  "Air Conditioning",
  "Washing Machine",
  "Balcony",
  "Garden",
  "Cultural Guide",
  "Luggage Storage",
];

const CATEGORIES = [
  { value: "homestay", label: "Traditional Homestay" },
  { value: "cottage", label: "Mountain Cottage" },
  { value: "villa", label: "Countryside Villa" },
  { value: "cabin", label: "Rustic Cabin" },
  { value: "traditional", label: "Heritage House" },
  { value: "treehouse", label: "Eco Treehouse" },
];

const PROVINCES = [
  "Gandaki",
  "Bagmati",
  "Koshi",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
  "Madhesh",
];

interface ListingWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingToEdit?: Listing | null;
  onSuccess: (listing: Listing) => void;
}

export default function ListingWizardModal({
  open,
  onOpenChange,
  listingToEdit,
  onSuccess,
}: ListingWizardModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "homestay",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      address: "",
      city: "",
      village: "",
      district: "",
      province: "Gandaki",
      country: "Nepal",
      coordinates: {
        latitude: 28.3758,
        longitude: 83.8083,
      },
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80",
        caption: "Front view of homestay",
      },
    ],
    amenities: ["WiFi", "Hot Water", "Organic Meals"] as string[],
    houseRules: [
      "No smoking inside bedrooms",
      "Remove outdoor shoes at the entrance",
      "Quiet hours after 10:00 PM",
    ] as string[],
    price: 35,
    cleaningFee: 10,
    minNights: 1,
    maxNights: 30,
    safetyInfo: {
      smokeAlarm: true,
      firstAidKit: true,
      emergencyContactName: "Host / Village Coordinator",
      emergencyContactPhone: "+977-9800000000",
      emergencyContact: "+977-9800000000",
      nearbyHospital: "Village Community Health Post (15 mins walk)",
      medicalFacility: "Village Community Health Post (15 mins walk)",
      policeStationContact: "Local Police Post / 100",
      safetyNotes: "Flashlight recommended for evening walks. Filtered spring water provided.",
      importantLocationNotes: "Trail marker 4 off the main suspension bridge.",
    },
  });

  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [newRule, setNewRule] = useState("");

  useEffect(() => {
    if (listingToEdit) {
      const loc = typeof listingToEdit.location === "object" ? listingToEdit.location : {};
      const imgs = Array.isArray(listingToEdit.images)
        ? listingToEdit.images.map((img) =>
            typeof img === "string" ? { url: img, caption: "" } : img
          )
        : [];
      const s = listingToEdit.safetyAndEmergency || {};

      setFormData({
        title: listingToEdit.title || "",
        description: listingToEdit.description || "",
        category: listingToEdit.category || "homestay",
        maxGuests: listingToEdit.maxGuests || 2,
        bedrooms: listingToEdit.bedrooms || 1,
        bathrooms: listingToEdit.bathrooms || 1,
        location: {
          address: (loc as any).address || "",
          city: (loc as any).city || "",
          village: (loc as any).village || (loc as any).city || "",
          district: (loc as any).district || "Kaski",
          province: (loc as any).province || "Gandaki",
          country: (loc as any).country || "Nepal",
          coordinates: (loc as any).coordinates || { latitude: 28.3758, longitude: 83.8083 },
        },
        images: imgs.length > 0 ? imgs : [{ url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800", caption: "Exterior" }],
        amenities: listingToEdit.amenities || ["WiFi", "Hot Water"],
        houseRules: [
          "No smoking inside bedrooms",
          "Remove outdoor shoes at entrance",
        ],
        price: listingToEdit.price || 35,
        cleaningFee: 10,
        minNights: 1,
        maxNights: 30,
        safetyInfo: {
          smokeAlarm: true,
          firstAidKit: true,
          emergencyContactName: s.emergencyContactName || "Host Coordinator",
          emergencyContactPhone: s.emergencyContactPhone || "+977-9800000000",
          emergencyContact: s.emergencyContactPhone || "+977-9800000000",
          nearbyHospital: s.nearbyHospital || "Village Health Post",
          medicalFacility: s.nearbyHospital || "Village Health Post",
          policeStationContact: s.policeStationContact || "100",
          safetyNotes: s.safetyNotes || "",
          importantLocationNotes: s.importantLocationNotes || "",
        },
      });
      setCurrentStep(1);
    } else {
      // Reset defaults
      setCurrentStep(1);
    }
  }, [listingToEdit, open]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.title || formData.title.trim().length < 5) {
        toast({ title: "Invalid title", description: "Title must be at least 5 characters long", variant: "destructive" });
        return;
      }
      if (!formData.description || formData.description.trim().length < 20) {
        toast({ title: "Invalid description", description: "Description must be at least 20 characters long", variant: "destructive" });
        return;
      }
    }
    if (currentStep === 2) {
      const city = formData.location.city.trim() || formData.location.village.trim();
      if (!city) {
        toast({ title: "Location required", description: "Please provide a village or city name", variant: "destructive" });
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.images || formData.images.length === 0) {
        toast({ title: "Photo required", description: "Please add at least one photo of your stay", variant: "destructive" });
        return;
      }
    }
    if (currentStep === 6) {
      if (!formData.price || Number(formData.price) <= 0) {
        toast({ title: "Price required", description: "Please enter a valid nightly price", variant: "destructive" });
        return;
      }
    }
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAddImage = () => {
    const trimmedUrl = newImageUrl.trim();
    if (!trimmedUrl) return;
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      toast({
        title: "Invalid Image URL",
        description: "Image URL must start with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { url: trimmedUrl, caption: newImageCaption.trim() || "Homestay photo" }],
    }));
    setNewImageUrl("");
    setNewImageCaption("");
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleToggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setFormData((prev) => ({
      ...prev,
      houseRules: [...prev.houseRules, newRule.trim()],
    }));
    setNewRule("");
  };

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      houseRules: prev.houseRules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (publishImmediate = true) => {
    // Pre-flight client-side validation
    if (!formData.title || formData.title.trim().length < 5) {
      setCurrentStep(1);
      toast({
        title: "Listing title required",
        description: "Title must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description || formData.description.trim().length < 20) {
      setCurrentStep(1);
      toast({
        title: "Description too short",
        description: "Description must be at least 20 characters long",
        variant: "destructive",
      });
      return;
    }

    const city = (formData.location.city || formData.location.village || formData.location.address || "").trim();
    const address = (formData.location.address || formData.location.village || formData.location.city || "").trim();

    if (!city || !address) {
      setCurrentStep(2);
      toast({
        title: "Location details required",
        description: "Please specify both the village/city name and local address",
        variant: "destructive",
      });
      return;
    }

    const validImages = (formData.images || []).filter(
      (img) => img && typeof img.url === "string" && img.url.trim().length > 0 && /^https?:\/\//i.test(img.url.trim())
    );

    if (validImages.length === 0) {
      setCurrentStep(3);
      toast({
        title: "Photo required",
        description: "Please provide at least one valid image with http(s) URL",
        variant: "destructive",
      });
      return;
    }

    const price = Number(formData.price);
    if (!Number.isFinite(price) || price <= 0) {
      setCurrentStep(6);
      toast({
        title: "Invalid nightly rate",
        description: "Price must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const lat = Number(formData.location.coordinates?.latitude) || 28.3758;
      const lng = Number(formData.location.coordinates?.longitude) || 83.8083;

      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || "homestay",
        maxGuests: Math.max(1, Number(formData.maxGuests) || 1),
        bedrooms: Math.max(0, Number(formData.bedrooms) || 1),
        bathrooms: Math.max(0, Number(formData.bathrooms) || 1),
        price,
        amenities: formData.amenities || [],
        houseRules: formData.houseRules || [],
        images: validImages.map((img) => ({
          url: img.url.trim(),
          caption: img.caption?.trim() || "Uploaded photo",
        })),
        checkInTime: "15:00",
        checkOutTime: "11:00",
        cancellationPolicy: "moderate",
        safetyAndEmergency: {
          emergencyContactName: (formData.safetyInfo?.emergencyContactName || "").trim(),
          emergencyContactPhone: (
            formData.safetyInfo?.emergencyContactPhone ||
            formData.safetyInfo?.emergencyContact ||
            ""
          ).trim(),
          nearbyHospital: (
            formData.safetyInfo?.nearbyHospital ||
            formData.safetyInfo?.medicalFacility ||
            ""
          ).trim(),
          policeStationContact: (formData.safetyInfo?.policeStationContact || "").trim(),
          safetyNotes: formData.safetyInfo?.safetyNotes
            ? typeof formData.safetyInfo.safetyNotes === "string"
              ? [formData.safetyInfo.safetyNotes.trim()]
              : formData.safetyInfo.safetyNotes
            : [],
          importantLocationNotes: (formData.safetyInfo?.importantLocationNotes || "").trim(),
        },
        location: {
          address,
          city,
          village: (formData.location.village || city).trim(),
          district: formData.location.district?.trim() || "Kaski",
          province: formData.location.province?.trim() || "Gandaki",
          country: formData.location.country?.trim() || "Nepal",
          coordinates: {
            latitude: lat,
            longitude: lng,
          },
          geoJSON: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      };

      let res;
      if (listingToEdit) {
        res = await listingsAPI.updateListing(listingToEdit.id || (listingToEdit as any)._id, payload);
      } else {
        res = await listingsAPI.createListing(payload);
      }

      if (res.success && res.data?.listing) {
        const savedListing = res.data.listing;
        if (publishImmediate && !listingToEdit) {
          await listingsAPI.publishListing(savedListing.id || savedListing._id);
        }
        toast({
          title: listingToEdit ? "Listing Updated" : "Listing Created Successfully",
          description: "Your property changes have been saved.",
        });
        onSuccess(savedListing);
        onOpenChange(false);
      } else {
        const errorMsg =
          res.message ||
          (res.errors && Array.isArray(res.errors)
            ? res.errors.map((e: any) => `${e.path || e.param}: ${e.msg}`).join("; ")
            : "Failed to save listing");

        toast({
          title: "Submission failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error saving listing",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-xl">
                {listingToEdit ? "Edit Property" : "List Your Homestay"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Step {currentStep} of 10: {WIZARD_STEPS[currentStep - 1].title}
              </DialogDescription>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-gaun-green/10 text-gaun-green">
              {Math.round((currentStep / 10) * 100)}% Complete
            </div>
          </div>

          {/* Stepper Dots Bar */}
          <div className="grid grid-cols-10 gap-1.5 pt-3">
            {WIZARD_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === s.step
                      ? "bg-gaun-green"
                      : currentStep > s.step
                      ? "bg-gaun-green/50"
                      : "bg-muted"
                  }`}
                  title={s.title}
                />
              );
            })}
          </div>
        </DialogHeader>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Tell guests about your homestay</h3>
              <div>
                <Label htmlFor="title">Listing Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Annapurna View Heritage Homestay"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Property Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxGuests">Maximum Guests</Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    min={1}
                    max={20}
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={1}
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={1}
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Property Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe your family hearth, mountain vistas, architecture, and hospitality..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* AI Description Assistant */}
              <ListingDescriptionGenerator
                initialData={{
                  title: formData.title,
                  category: formData.category,
                  location: formData.location.city,
                  amenities: formData.amenities,
                  bedrooms: formData.bedrooms,
                  bathrooms: formData.bathrooms,
                  maxGuests: formData.maxGuests,
                }}
                onApply={(data) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: data.title,
                    description: data.description,
                  }))
                }
              />
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Where is your property located?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="village">Village Name</Label>
                  <Input
                    id="village"
                    placeholder="e.g. Ghandruk, Bandipur, Sirubari"
                    value={formData.location.village}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, village: e.target.value, city: e.target.value },
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="e.g. Kaski, Tanahun, Syangja"
                    value={formData.location.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, district: e.target.value },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.location.province}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, province: val },
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address">Local Address / Ward</Label>
                  <Input
                    id="address"
                    placeholder="e.g. Upper Ghandruk, Ward 10"
                    value={formData.location.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, address: e.target.value },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="lat">Latitude (GPS)</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.0001"
                    value={formData.location.coordinates.latitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          coordinates: {
                            ...formData.location.coordinates,
                            latitude: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude (GPS)</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.0001"
                    value={formData.location.coordinates.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          coordinates: {
                            ...formData.location.coordinates,
                            longitude: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Add high-quality photos</h3>
              <p className="text-xs text-muted-foreground">
                Include pictures of the guest rooms, views, dining area, and surrounding village.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Paste Image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Caption (e.g. Balcony view)"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  className="text-xs w-48"
                />
                <Button type="button" size="sm" onClick={handleAddImage} className="bg-gaun-green text-white shrink-0">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Photo
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border group bg-secondary">
                    <img
                      src={img.url}
                      alt={img.caption || "Homestay"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80";
                      }}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-gaun-green text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        Cover Photo
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {img.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] p-1.5 truncate">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Amenities */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">What amenities do you offer?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map((amenity) => (
                  <label
                    key={amenity}
                    className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                      formData.amenities.includes(amenity)
                        ? "border-gaun-green bg-gaun-green/10"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleToggleAmenity(amenity)}
                    />
                    <span className="text-xs font-medium text-foreground">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: House Rules */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">House Rules & Guest Guidelines</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom rule (e.g. No loud music after 9 PM)"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  className="text-xs"
                />
                <Button type="button" size="sm" onClick={handleAddRule} className="shrink-0 bg-gaun-green text-white">
                  Add Rule
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                {formData.houseRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-secondary/40 border border-border rounded-xl text-xs">
                    <span>• {rule}</span>
                    <button type="button" onClick={() => handleRemoveRule(idx)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Pricing */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Set your nightly rate</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Base Price per Night (Rs. NPR)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="mt-1 font-semibold text-base"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Average homestay in this region: Rs. 1,500 - Rs. 3,500/night</p>
                </div>
                <div>
                  <Label htmlFor="cleaningFee">Cleaning / Service Fee (Rs. NPR)</Label>
                  <Input
                    id="cleaningFee"
                    type="number"
                    min={0}
                    value={formData.cleaningFee}
                    onChange={(e) => setFormData({ ...formData, cleaningFee: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* AI Pricing Recommendation */}
              {listingToEdit && (
                <div className="pt-2">
                  <PricingRecommendation
                    listingId={listingToEdit.id || (listingToEdit as any)._id}
                    currentPrice={formData.price}
                    onApply={(recPrice) => setFormData((prev) => ({ ...prev, price: recPrice }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 7: Availability */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Availability & Booking Limits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minNights">Minimum Nights Stay</Label>
                  <Input
                    id="minNights"
                    type="number"
                    min={1}
                    value={formData.minNights}
                    onChange={(e) => setFormData({ ...formData, minNights: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxNights">Maximum Nights Stay</Label>
                  <Input
                    id="maxNights"
                    type="number"
                    min={1}
                    value={formData.maxNights}
                    onChange={(e) => setFormData({ ...formData, maxNights: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-xl border border-border">
                💡 You can block specific dates anytime directly from your host booking calendar.
              </p>
            </div>
          )}

          {/* Step 8: Safety */}
          {currentStep === 8 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Guest Safety, Health & Local Contacts</h3>
              <p className="text-xs text-muted-foreground">
                Help travelers feel secure in rural areas by providing verified emergency contacts and local health guidance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Person</Label>
                  <Input
                    id="emergencyContactName"
                    placeholder="e.g. Village Lead / Host Coordinator"
                    value={formData.safetyInfo.emergencyContactName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        safetyInfo: { ...formData.safetyInfo, emergencyContactName: e.target.value },
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Phone Number</Label>
                  <Input
                    id="emergencyContactPhone"
                    placeholder="e.g. +977-9800000000"
                    value={formData.safetyInfo.emergencyContactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        safetyInfo: {
                          ...formData.safetyInfo,
                          emergencyContactPhone: e.target.value,
                          emergencyContact: e.target.value,
                        },
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicalFacility">Nearest Health Post / Hospital</Label>
                  <Input
                    id="medicalFacility"
                    placeholder="e.g. Ghandruk Health Post (15m walk), Pokhara Hospital (3h drive)"
                    value={formData.safetyInfo.nearbyHospital}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        safetyInfo: {
                          ...formData.safetyInfo,
                          nearbyHospital: e.target.value,
                          medicalFacility: e.target.value,
                        },
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="policeStationContact">Police Post Contact / Ward Lead</Label>
                  <Input
                    id="policeStationContact"
                    placeholder="e.g. Area Police Post / 100 / 061-XXXXXX"
                    value={formData.safetyInfo.policeStationContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        safetyInfo: { ...formData.safetyInfo, policeStationContact: e.target.value },
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="safetyNotes">Safety Precautions & Practical Tips</Label>
                <Textarea
                  id="safetyNotes"
                  rows={2}
                  placeholder="e.g. Carry a flashlight for evening stone stairways. Filtered mountain spring water provided."
                  value={formData.safetyInfo.safetyNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyInfo: { ...formData.safetyInfo, safetyNotes: e.target.value },
                    })
                  }
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="importantLocationNotes">Location & Trail Advisories</Label>
                <Textarea
                  id="importantLocationNotes"
                  rows={2}
                  placeholder="e.g. Homestay is accessible via a 15-minute stone staircase hike from the lower jeep stop."
                  value={formData.safetyInfo.importantLocationNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyInfo: { ...formData.safetyInfo, importantLocationNotes: e.target.value },
                    })
                  }
                  className="mt-1 text-xs"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.safetyInfo.firstAidKit}
                    onCheckedChange={(c) =>
                      setFormData({
                        ...formData,
                        safetyInfo: { ...formData.safetyInfo, firstAidKit: Boolean(c) },
                      })
                    }
                  />
                  <span className="text-xs">First aid kit available on premises</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.safetyInfo.smokeAlarm}
                    onCheckedChange={(c) =>
                      setFormData({
                        ...formData,
                        safetyInfo: { ...formData.safetyInfo, smokeAlarm: Boolean(c) },
                      })
                    }
                  />
                  <span className="text-xs">Fire safety / smoke precautions</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 9: Preview */}
          {currentStep === 9 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-base font-semibold">Listing Card Preview</h3>
              <div className="max-w-sm mx-auto border border-border rounded-2xl overflow-hidden shadow-md bg-card">
                <div className="aspect-[4/3] bg-secondary relative">
                  <img
                    src={formData.images[0]?.url || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80"}
                    alt={formData.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80";
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">
                    {formData.location.city || "Nepal"}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-display font-bold text-base line-clamp-1">{formData.title || "Untitled Homestay"}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{formData.description}</p>
                  <div className="pt-2 border-t flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{formData.maxGuests} Guests • {formData.bedrooms} Beds</span>
                    <span className="font-bold text-gaun-green">Rs. {formData.price?.toLocaleString()} / night</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 10: Publish */}
          {currentStep === 10 && (
            <div className="space-y-6 text-center py-6 animate-in fade-in-50 duration-200">
              <CheckCircle2 className="h-14 w-14 text-gaun-green mx-auto" />
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-display font-bold">Ready to Launch!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your homestay listing is ready. You can publish it now for traveler bookings or save it to your dashboard as a draft.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleSubmit(false)}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                  className="bg-gaun-green hover:bg-gaun-light-green text-white font-semibold px-6"
                >
                  {submitting ? "Saving..." : "Publish Listing"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="p-4 border-t border-border bg-secondary/20 flex sm:justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentStep === 1 || submitting}
            onClick={handlePrev}
            className="text-xs"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < 10 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs font-semibold"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Review and submit above</span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
