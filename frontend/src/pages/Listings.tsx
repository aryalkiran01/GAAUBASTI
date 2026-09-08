/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useListings } from "@/hooks/useListings";
import { useAuth } from "@/context/AuthContext";
import { savedSearchesAPI } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import SearchForm from "@/components/SearchForm";
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
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "averageRating-desc", label: "Highest rated" },
];

const Listings = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const locationParam = urlSearchParams.get("location") || "";
  const guestsParam = urlSearchParams.get("guests") || "";

  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [priceApplied, setPriceApplied] = useState<[number, number]>([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>("createdAt-desc");
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState("");

  const apiParams = useMemo(() => {
    const params: any = {
      page,
      limit: 12,
      sortBy: sortOption.split("-")[0],
      sortOrder: sortOption.split("-")[1],
    };
    if (locationParam) params.location = locationParam;
    if (guestsParam) params.guests = parseInt(guestsParam);
    if (priceApplied[0] > 0) params.minPrice = priceApplied[0];
    if (priceApplied[1] < 500) params.maxPrice = priceApplied[1];
    if (selectedCategory) params.category = selectedCategory;
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities;
    if (minRating > 0) params.rating = minRating;
    return params;
  }, [
    page,
    sortOption,
    locationParam,
    guestsParam,
    priceApplied,
    selectedCategory,
    selectedAmenities,
    minRating,
  ]);

  const { listings, loading, error, pagination } = useListings(apiParams);

  useEffect(() => {
    setPage(1);
  }, [locationParam, guestsParam, priceApplied, selectedCategory, selectedAmenities, minRating, sortOption]);

  useEffect(() => {
    if (user) {
      savedSearchesAPI.getSavedSearches().then((res) => {
        if (res.success) setSavedSearches(res.data.searches || []);
      });
    }
  }, [user]);

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (priceApplied[0] > 0 || priceApplied[1] < 500 ? 1 : 0) +
    (selectedAmenities.length > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setPriceApplied([0, 500]);
    setSelectedCategory(null);
    setSelectedAmenities([]);
    setMinRating(0);
  };

  const applyPriceFilter = () => {
    setPriceApplied(priceRange);
    setShowFilters(false);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    const filters: any = {};
    if (locationParam) filters.location = locationParam;
    if (guestsParam) filters.guests = parseInt(guestsParam);
    if (priceApplied[0] > 0) filters.minPrice = priceApplied[0];
    if (priceApplied[1] < 500) filters.maxPrice = priceApplied[1];
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedAmenities.length > 0) filters.amenities = selectedAmenities;
    if (minRating > 0) filters.rating = minRating;
    filters.sortBy = sortOption.split("-")[0];
    filters.sortOrder = sortOption.split("-")[1];

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
    setUrlSearchParams(params);

    setPriceRange([f.minPrice || 0, f.maxPrice || 500]);
    setPriceApplied([f.minPrice || 0, f.maxPrice || 500]);
    setSelectedCategory(f.category || null);
    setSelectedAmenities(f.amenities || []);
    setMinRating(f.rating || 0);
    if (f.sortBy && f.sortOrder) {
      setSortOption(`${f.sortBy}-${f.sortOrder}`);
    }
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
    <div className="min-h-screen">
      <SEO
        title="Browse Homestays"
        description="Search and filter homestays, cottages, villas, and unique stays across Nepal. Find your perfect accommodation by location, price, amenities, and more."
        canonicalPath="/listings"
      />
      <section className="bg-secondary/50 py-8 md:py-10 border-b border-border">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-6">
            Find your perfect stay
          </h1>
          <SearchForm />

          {user && savedSearches.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Saved searches:</span>
              {savedSearches.map((search) => (
                <div
                  key={search._id || search.id}
                  className="inline-flex items-center gap-1.5 bg-white border border-border rounded-full pl-3 pr-1 py-1 text-sm hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => applySavedSearch(search)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && applySavedSearch(search)}
                >
                  <Bookmark className="h-3.5 w-3.5 text-gaun-green" />
                  <span>{search.name}</span>
                  <button
                    onClick={(e) => handleDeleteSavedSearch(search._id || search.id, e)}
                    aria-label="Delete saved search"
                    className="h-5 w-5 rounded-full hover:bg-secondary flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium">
                {loading
                  ? "Loading..."
                  : `${pagination?.totalListings ?? listings.length} ${listings.length === 1 ? "stay" : "stays"} available`}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                  Clear ({activeFilterCount})
                </Button>
              )}
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveSearch(!showSaveSearch)}
                >
                  <Bookmark className="h-4 w-4" />
                  Save search
                </Button>
              )}
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger size="sm" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-5" align="end">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Price range</h3>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={(v) => setPriceRange(v as [number, number])}
                          max={500}
                          min={0}
                          step={10}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}{priceRange[1] >= 500 ? "+" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() =>
                              setSelectedCategory(
                                selectedCategory === cat.value ? null : cat.value,
                              )
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selectedCategory === cat.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-secondary"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Minimum rating</h3>
                      <div className="flex gap-2">
                        {[0, 3, 4, 4.5].map((r) => (
                          <button
                            key={r}
                            onClick={() => setMinRating(r)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                              minRating === r
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-secondary"
                            }`}
                          >
                            {r === 0 ? (
                              "Any"
                            ) : (
                              <>
                                <Star className="h-3 w-3" />
                                {r}+
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Amenities</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {AMENITIES.map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                              id={`amenity-${amenity}`}
                              checked={selectedAmenities.includes(amenity)}
                              onCheckedChange={() => toggleAmenity(amenity)}
                            />
                            <label
                              htmlFor={`amenity-${amenity}`}
                              className="text-sm cursor-pointer select-none"
                            >
                              {amenity}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" onClick={applyPriceFilter}>
                      Apply filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {showSaveSearch && (
            <div className="mb-6 p-4 border rounded-lg bg-secondary/30 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Input
                placeholder="Name this search (e.g. 'Weekend cottages')"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
              />
              <Button onClick={handleSaveSearch} className="bg-gaun-green hover:bg-gaun-light-green">
                Save
              </Button>
              <Button variant="ghost" onClick={() => setShowSaveSearch(false)}>
                Cancel
              </Button>
            </div>
          )}

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
                  <div key={listing.id} className="h-full">
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No listings found"
              description="Try adjusting your search criteria or explore other locations."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default Listings;
