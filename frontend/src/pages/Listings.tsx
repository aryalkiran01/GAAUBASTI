/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useListings } from "@/hooks/useListings";
import ListingCard from "@/components/ListingCard";
import SearchForm from "@/components/SearchForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { EmptyState } from "@/components/EmptyState";
import { SearchX, SlidersHorizontal, X } from "lucide-react";

const Listings = () => {
  const [urlSearchParams] = useSearchParams();

  const locationParam = urlSearchParams.get("location");
  const dateParam = urlSearchParams.get("date");
  const guestsParam = urlSearchParams.get("guests");

  const apiSearchParams: any = {};
  if (locationParam) apiSearchParams.location = locationParam;
  if (guestsParam) apiSearchParams.guests = parseInt(guestsParam);

  const { listings, loading, error, pagination } = useListings(apiSearchParams);

  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { value: "homestay", label: "Homestay" },
    { value: "cottage", label: "Cottage" },
    { value: "villa", label: "Villa" },
    { value: "traditional", label: "Traditional" },
    { value: "treehouse", label: "Treehouse" },
    { value: "cabin", label: "Cabin" },
  ];

  const filteredListings = listings.filter((listing) => {
    if (listing.price < priceRange[0] || listing.price > priceRange[1])
      return false;
    if (selectedCategory && listing.category !== selectedCategory) return false;
    return true;
  });

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen">
      {/* Search Section */}
      <section className="bg-secondary/50 py-8 md:py-10 border-b border-border">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-6">
            Find your perfect stay
          </h1>
          <SearchForm />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-10 md:py-14">
        <div className="container">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium">
                {loading
                  ? "Loading..."
                  : `${filteredListings.length} ${filteredListings.length === 1 ? "stay" : "stays"} available`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(selectedCategory ||
                priceRange[0] > 0 ||
                priceRange[1] < 500) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-5" align="end">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">
                        Price range
                      </h3>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={500}
                          min={0}
                          step={10}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}+</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() =>
                              setSelectedCategory(
                                selectedCategory === cat.value
                                  ? null
                                  : cat.value,
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
                    <Button
                      className="w-full"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Listings Grid */}
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
            <EmptyState
              icon={SearchX}
              title="Error loading listings"
              description={error}
            />
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="h-full">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
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
