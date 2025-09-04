
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useListings } from "@/hooks/useListings";
import ListingCard from "@/components/ListingCard";
import SearchForm from "@/components/SearchForm";
import { Skeleton } from "@/components/ui/skeleton";

const Listings = () => {
const [urlSearchParams] = useSearchParams();

const locationParam = urlSearchParams.get("location");
const dateParam = urlSearchParams.get("date");
const guestsParam = urlSearchParams.get("guests");

// Build search parameters for API
const apiSearchParams: any = {};
if (locationParam) apiSearchParams.location = locationParam;
if (guestsParam) apiSearchParams.guests = parseInt(guestsParam);

const { listings, loading, error, pagination } = useListings(apiSearchParams);

  return (
    <div className="min-h-screen">
      {/* Search Section */}
      <section className="bg-gaun-cream py-8">
        <div className="container">
          <h1 className="text-3xl font-serif font-bold mb-6">Find your perfect stay</h1>
          <SearchForm />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-semibold">
              {loading ? 'Loading...' : `${listings.length} ${listings.length === 1 ? 'stay' : 'stays'} available`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2 text-red-600">Error loading listings</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="h-full">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No listings found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or explore other locations.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Listings;
