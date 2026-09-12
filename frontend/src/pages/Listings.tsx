/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useListings } from "@/hooks/useListings";
import { useAuth } from "@/context/AuthContext";
import { savedSearchesAPI } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import SearchForm from "@/components/SearchForm";
import MapView from "@/components/MapView";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/EmptyState";
import {
  SearchX,
  SlidersHorizontal,
  X,
  Bookmark,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  LayoutGrid,
  Map as MapIcon,
  Columns2,
  Navigation,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AMENITIES = [
  "WiFi",
  "Kitchen",
  "Parking",
  "Air Conditioning",
  "Heating",
  "Washing Machine",
  "TV",
  "Pool",
  "Garden",
  "Breakfast",
  "Hot Water",
  "Mountain View",
  "Campfire",
  "Organic Meals",
];

const CATEGORIES = [
  { value: "homestay", label: "Homestay" },
  { value: "cottage", label: "Cottage" },
  { value: "villa", label: "Villa" },
  { value: "traditional", label: "Traditional" },
  { value: "treehouse", label: "Treehouse" },
  { value: "cabin", label: "Cabin" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "averageRating-desc", label: "Highest Rated" },
  { value: "reviewCount-desc", label: "Most Reviewed" },
  { value: "createdAt-desc", label: "Newest First" },
];

type ViewMode = "grid" | "split" | "map";

export default function Listings() {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const MAX_DEFAULT_PRICE = 20000;

  // Read URL search params
  const locationParam = urlSearchParams.get("location") || "";
  const guestsParam = urlSearchParams.get("guests") || "";
  const minPriceParam = urlSearchParams.get("minPrice") ? Number(urlSearchParams.get("minPrice")) : 0;
  const maxPriceParam = urlSearchParams.get("maxPrice") ? Number(urlSearchParams.get("maxPrice")) : MAX_DEFAULT_PRICE;
  const categoryParam = urlSearchParams.get("category") || null;
  const amenitiesParam = urlSearchParams.get("amenities") ? urlSearchParams.get("amenities")!.split(",") : [];
  const ratingParam = urlSearchParams.get("rating") ? Number(urlSearchParams.get("rating")) : 0;
  const sortParam = urlSearchParams.get("sort") || "recommended";
  const latParam = urlSearchParams.get("lat") ? Number(urlSearchParams.get("lat")) : null;
  const lngParam = urlSearchParams.get("lng") ? Number(urlSearchParams.get("lng")) : null;
  const radiusParam = urlSearchParams.get("radius") ? Number(urlSearchParams.get("radius")) : 25;
  const pageParam = urlSearchParams.get("page") ? Number(urlSearchParams.get("page")) : 1;
  const viewModeParam = (urlSearchParams.get("view") as ViewMode) || "grid";

  // UI States synced with URL
  const [viewMode, setViewMode] = useState<ViewMode>(viewModeParam);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([minPriceParam, maxPriceParam]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Saved Searches
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState("");

  // Helper to update URL params consistently
  const updateUrlParams = (updates: Record<string, string | number | null | undefined>) => {
    const newParams = new URLSearchParams(urlSearchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === "" || val === 0) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(val));
      }
    });
    setUrlSearchParams(newParams);
  };

  // Switch View Mode
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    updateUrlParams({ view: mode === "grid" ? null : mode });
  };

  // Build API Query
  const apiParams = useMemo(() => {
    const params: any = {
      page: pageParam,
      limit: viewMode === "map" ? 50 : 12,
    };

    if (sortParam === "recommended") {
      params.sortBy = "recommended";
    } else if (sortParam.includes("-")) {
      params.sortBy = sortParam.split("-")[0];
      params.sortOrder = sortParam.split("-")[1];
    }

    if (locationParam) params.location = locationParam;
    if (guestsParam) params.guests = parseInt(guestsParam);
    if (minPriceParam > 0) params.minPrice = minPriceParam;
    if (maxPriceParam < MAX_DEFAULT_PRICE) params.maxPrice = maxPriceParam;
    if (categoryParam) params.category = categoryParam;
    if (amenitiesParam.length > 0) params.amenities = amenitiesParam;
    if (ratingParam > 0) params.rating = ratingParam;

    // Geo radius search if lat & lng present
    if (latParam !== null && lngParam !== null) {
      params.lat = latParam;
      params.lng = lngParam;
      params.radius = radiusParam;
    }

    return params;
  }, [
    pageParam,
    sortParam,
    locationParam,
    guestsParam,
    minPriceParam,
    maxPriceParam,
    categoryParam,
    amenitiesParam,
    ratingParam,
    latParam,
    lngParam,
    radiusParam,
    viewMode,
  ]);

  const { listings, loading, error, pagination } = useListings(apiParams);

  useEffect(() => {
    if (user) {
      savedSearchesAPI.getSavedSearches().then((res) => {
        if (res.success) setSavedSearches(res.data.searches || []);
      });
    }
  }, [user]);

  const activeFilterCount =
    (categoryParam ? 1 : 0) +
    (minPriceParam > 0 || maxPriceParam < MAX_DEFAULT_PRICE ? 1 : 0) +
    (amenitiesParam.length > 0 ? 1 : 0) +
    (ratingParam > 0 ? 1 : 0) +
    (latParam !== null ? 1 : 0);

  const clearFilters = () => {
    setPriceRange([0, MAX_DEFAULT_PRICE]);
    const newParams = new URLSearchParams();
    if (locationParam) newParams.set("location", locationParam);
    if (viewMode !== "grid") newParams.set("view", viewMode);
    setUrlSearchParams(newParams);
  };

  const applyPriceFilter = () => {
    updateUrlParams({
      minPrice: priceRange[0] > 0 ? priceRange[0] : null,
      maxPrice: priceRange[1] < MAX_DEFAULT_PRICE ? priceRange[1] : null,
      page: 1,
    });
    setShowFilters(false);
  };

  const toggleCategory = (cat: string) => {
    updateUrlParams({
      category: categoryParam === cat ? null : cat,
      page: 1,
    });
  };

  const toggleAmenity = (amenity: string) => {
    const next = amenitiesParam.includes(amenity)
      ? amenitiesParam.filter((a) => a !== amenity)
      : [...amenitiesParam, amenity];
    updateUrlParams({
      amenities: next.length > 0 ? next.join(",") : null,
      page: 1,
    });
  };

  const handleRatingChange = (r: number) => {
    updateUrlParams({
      rating: r > 0 ? r : null,
      page: 1,
    });
  };

  const handleSortChange = (newSort: string) => {
    updateUrlParams({ sort: newSort, page: 1 });
  };

  const handleSearchThisArea = ({ lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }) => {
    updateUrlParams({
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      radius: Math.round(radiusKm),
      page: 1,
    });
    toast({
      title: "Search Area Updated",
      description: `Searching stays within ${Math.round(radiusKm)}km radius`,
    });
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    const filters: any = {};
    if (locationParam) filters.location = locationParam;
    if (guestsParam) filters.guests = parseInt(guestsParam);
    if (minPriceParam > 0) filters.minPrice = minPriceParam;
    if (maxPriceParam < 500) filters.maxPrice = maxPriceParam;
    if (categoryParam) filters.category = categoryParam;
    if (amenitiesParam.length > 0) filters.amenities = amenitiesParam;
    if (ratingParam > 0) filters.rating = ratingParam;
    filters.sort = sortParam;

    const res = await savedSearchesAPI.createSavedSearch({
      name: searchName.trim(),
      filters,
    });

    if (res.success) {
      setSavedSearches((prev) => [res.data.search, ...prev]);
      setSearchName("");
      setShowSaveSearch(false);
      toast({ title: "Search saved" });
    } else {
      toast({ title: "Failed to save search", description: res.message, variant: "destructive" });
    }
  };

  const applySavedSearch = (search: any) => {
    const f = search.filters || {};
    const params = new URLSearchParams();
    if (f.location) params.append("location", f.location);
    if (f.guests) params.append("guests", String(f.guests));
    if (f.minPrice) params.append("minPrice", String(f.minPrice));
    if (f.maxPrice) params.append("maxPrice", String(f.maxPrice));
    if (f.category) params.append("category", f.category);
    if (f.amenities) params.append("amenities", Array.isArray(f.amenities) ? f.amenities.join(",") : f.amenities);
    if (f.rating) params.append("rating", String(f.rating));
    if (f.sort) params.append("sort", f.sort);
    setUrlSearchParams(params);
  };

  const handleDeleteSavedSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await savedSearchesAPI.deleteSavedSearch(id);
    if (res.success) {
      setSavedSearches((prev) => prev.filter((s) => (s._id || s.id) !== id));
      toast({ title: "Saved search deleted" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Find Authentic Homestays & Stays | Gaun Basti"
        description="Search, filter, and discover homestays, cottages, and heritage stays across Nepal with interactive map view, price filters, and village discovery."
        canonicalPath="/listings"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Listings", url: "/listings" }
        ]}
      />

      {/* Header Search Banner */}
      <section className="bg-secondary/50 py-6 md:py-8 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
                Find your perfect stay
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Explore verified authentic homestays in scenic villages across Nepal.
              </p>
            </div>

            {/* View Mode Buttons (Desktop) */}
            <div className="hidden sm:flex items-center gap-1 bg-background p-1 border border-border rounded-lg self-start md:self-auto">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("grid")}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === "grid" ? "bg-gaun-green text-white hover:bg-gaun-light-green" : ""}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </Button>
              <Button
                variant={viewMode === "split" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("split")}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === "split" ? "bg-gaun-green text-white hover:bg-gaun-light-green" : ""}`}
              >
                <Columns2 className="h-3.5 w-3.5" />
                Split
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("map")}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === "map" ? "bg-gaun-green text-white hover:bg-gaun-light-green" : ""}`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Map
              </Button>
            </div>
          </div>

          <SearchForm />

          {/* Saved Searches */}
          {user && savedSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Saved searches:</span>
              {savedSearches.map((search) => (
                <div
                  key={search._id || search.id}
                  className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full pl-3 pr-1.5 py-0.5 text-xs hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => applySavedSearch(search)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && applySavedSearch(search)}
                >
                  <Bookmark className="h-3 w-3 text-gaun-green" />
                  <span>{search.name}</span>
                  <button
                    onClick={(e) => handleDeleteSavedSearch(search._id || search.id, e)}
                    aria-label="Delete saved search"
                    className="h-4 w-4 rounded-full hover:bg-secondary flex items-center justify-center ml-1"
                  >
                    <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="py-4 border-b border-border bg-background sticky top-16 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-medium">
              {loading
                ? "Searching..."
                : `${pagination?.totalListings ?? listings.length} ${
                    listings.length === 1 ? "stay" : "stays"
                  } available`}
            </h2>

            {latParam !== null && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-gaun-green/10 text-gaun-green px-2 py-0.5 rounded-full font-medium">
                <Navigation className="h-3 w-3" />
                Area filtered ({radiusParam}km)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground h-8"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}

            {user && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowSaveSearch(!showSaveSearch)}
              >
                <Bookmark className="h-3.5 w-3.5 mr-1" />
                Save search
              </Button>
            )}

            {/* Sorting Select */}
            <Select value={sortParam} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[160px] md:w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters Popover */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 h-4 w-4 rounded-full bg-gaun-green text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[330px] p-5 space-y-6" align="end">
                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Price range (per night)</h3>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={(v) => setPriceRange(v as [number, number])}
                      max={MAX_DEFAULT_PRICE}
                      min={0}
                      step={200}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Rs. {priceRange[0].toLocaleString()}</span>
                      <span>Rs. {priceRange[1].toLocaleString()}{priceRange[1] >= MAX_DEFAULT_PRICE ? "+" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Property Type</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => toggleCategory(cat.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          categoryParam === cat.value
                            ? "bg-gaun-green text-white border-gaun-green"
                            : "bg-background border-border hover:bg-secondary text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minimum Rating */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Minimum Rating</h3>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRatingChange(r)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                          ratingParam === r
                            ? "bg-gaun-green text-white border-gaun-green"
                            : "bg-background border-border hover:bg-secondary text-foreground"
                        }`}
                      >
                        {r === 0 ? (
                          "Any"
                        ) : (
                          <>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {r}+
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Amenities</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {AMENITIES.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={amenitiesParam.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(amenity)}
                        />
                        <label
                          htmlFor={`amenity-${amenity}`}
                          className="text-xs cursor-pointer select-none text-foreground"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-gaun-green hover:bg-gaun-light-green text-white text-xs" onClick={applyPriceFilter}>
                  Apply Filters
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      {/* Save Search Form Modal/Bar */}
      {showSaveSearch && (
        <div className="container py-3">
          <div className="p-4 border rounded-xl bg-secondary/40 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Input
              placeholder="Name this search (e.g. 'Ghandruk mountain views')"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
            />
            <Button onClick={handleSaveSearch} className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs">
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSaveSearch(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Listing View (Grid, Split, or Map) */}
      <div className="flex-1">
        {/* Full Map View */}
        {viewMode === "map" && (
          <div className="h-[calc(100vh-180px)] w-full">
            <MapView
              listings={listings}
              selectedListingId={selectedListingId}
              onSelectListing={setSelectedListingId}
              onSearchArea={handleSearchThisArea}
              enableAreaSearch={true}
              radiusKm={radiusParam}
            />
          </div>
        )}

        {/* Split View (Cards on left, Sticky Map on right) */}
        {viewMode === "split" && (
          <div className="container py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Listings */}
              <div className="lg:col-span-6 xl:col-span-7 space-y-6">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <EmptyState icon={SearchX} title="Error loading listings" description={error} />
                ) : listings.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {listings.map((listing) => (
                        <div
                          key={listing.id || (listing as any)._id}
                          className={`transition-all rounded-2xl ${
                            selectedListingId === (listing.id || (listing as any)._id)
                              ? "ring-2 ring-gaun-green ring-offset-2"
                              : ""
                          }`}
                          onMouseEnter={() => setSelectedListingId(listing.id || (listing as any)._id)}
                        >
                          <ListingCard listing={listing} />
                        </div>
                      ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pagination.hasPrevPage}
                          onClick={() => updateUrlParams({ page: pageParam - 1 })}
                          className="text-xs"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                          Previous
                        </Button>
                        <span className="text-xs text-muted-foreground px-2">
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pagination.hasNextPage}
                          onClick={() => updateUrlParams({ page: pageParam + 1 })}
                          className="text-xs"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon={SearchX}
                    title="No listings found in this area"
                    description="Try zooming out the map or clearing filters to discover more stays."
                    action={
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                )}
              </div>

              {/* Right Column: Sticky Leaflet Map */}
              <div className="hidden lg:block lg:col-span-6 xl:col-span-5 sticky top-36 h-[calc(100vh-160px)] rounded-2xl overflow-hidden border border-border shadow-sm">
                <MapView
                  listings={listings}
                  selectedListingId={selectedListingId}
                  onSelectListing={setSelectedListingId}
                  onSearchArea={handleSearchThisArea}
                  enableAreaSearch={true}
                  radiusKm={radiusParam}
                />
              </div>
            </div>
          </div>
        )}

        {/* Standard Grid View */}
        {viewMode === "grid" && (
          <section className="container py-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState icon={SearchX} title="Error loading listings" description={error} />
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {listings.map((listing) => (
                    <div key={listing.id || (listing as any)._id} className="h-full">
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => updateUrlParams({ page: pageParam - 1 })}
                      className="text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground px-3">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => updateUrlParams({ page: pageParam + 1 })}
                      className="text-xs"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No listings found"
                description="Try adjusting your search filters or explore our featured village destinations."
                action={
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </section>
        )}
      </div>

      {/* Floating Mobile Map / List Toggle */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => handleViewModeChange(viewMode === "map" ? "grid" : "map")}
          className="rounded-full shadow-2xl bg-foreground text-background hover:bg-foreground/90 px-5 py-2.5 flex items-center gap-2 font-medium text-xs border border-border"
        >
          {viewMode === "map" ? (
            <>
              <LayoutGrid className="h-4 w-4" />
              Show List
            </>
          ) : (
            <>
              <MapIcon className="h-4 w-4" />
              Show Map
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
