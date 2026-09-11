/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { villageAPI } from "@/lib/api";
import { Village } from "@/types";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Mountain,
  Search,
  Compass,
  ArrowRight,
  Home,
  Sparkles,
} from "lucide-react";

const PROVINCES = [
  "All Provinces",
  "Gandaki",
  "Bagmati",
  "Koshi",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
  "Madhesh",
];

export default function Villages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProvince = searchParams.get("province") || "All Provinces";
  const initialQuery = searchParams.get("q") || "";

  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>(initialProvince);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  useEffect(() => {
    const fetchVillages = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (selectedProvince !== "All Provinces") {
          params.province = selectedProvince;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        const res = await villageAPI.getVillages(params);
        if (res.success && res.data) {
          setVillages(res.data.villages || []);
        } else {
          setError(res.message || "Failed to load villages.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchVillages();
  }, [selectedProvince, searchQuery]);

  const handleProvinceSelect = (prov: string) => {
    setSelectedProvince(prov);
    const newParams = new URLSearchParams(searchParams);
    if (prov === "All Provinces") {
      newParams.delete("province");
    } else {
      newParams.set("province", prov);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set("q", searchQuery.trim());
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Explore Nepal's Heritage Villages | Gaun Basti"
        description="Discover authentic rural villages of Nepal. Experience local culture, organic Himalayan cuisine, age-old traditions, and authentic community homestays."
        canonicalPath="/villages"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Villages", url: "/villages" }
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-secondary/60 py-16 md:py-24 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gaun-green/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="container relative z-10 max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gaun-green/10 text-gaun-green text-sm font-medium">
            <Compass className="h-4 w-4" />
            <span>Community-Rooted Rural Tourism</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground">
            Explore Nepal’s Living Villages
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Step into timeless hamlets in the shadows of the Himalayas. Live with local families, taste traditional culinary delicacies, and experience living traditions.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto flex items-center bg-background border border-border shadow-md rounded-full p-1.5 focus-within:ring-2 focus-within:ring-gaun-green transition-all"
          >
            <div className="flex items-center pl-4 text-muted-foreground flex-1">
              <Search className="h-5 w-5 mr-2" />
              <Input
                type="text"
                placeholder="Search village, district, or cultural highlights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm"
              />
            </div>
            <Button
              type="submit"
              className="rounded-full px-6 bg-gaun-green hover:bg-gaun-light-green text-white font-medium"
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 md:py-16">
        <div className="container">
          {/* Province Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {PROVINCES.map((prov) => (
              <button
                key={prov}
                onClick={() => handleProvinceSelect(prov)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  selectedProvince === prov
                    ? "bg-gaun-green text-white border-gaun-green shadow-sm"
                    : "bg-secondary/70 hover:bg-secondary border-border text-foreground"
                }`}
              >
                {prov}
              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold">
              {loading ? (
                "Discovering villages..."
              ) : (
                <span>
                  {villages.length} {villages.length === 1 ? "Village" : "Villages"} Found
                  {selectedProvince !== "All Provinces" && ` in ${selectedProvince}`}
                </span>
              )}
            </h2>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-4">
                  <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-secondary/30 rounded-2xl border border-border">
              <p className="text-destructive font-medium mb-2">{error}</p>
              <Button variant="outline" onClick={() => setSelectedProvince("All Provinces")}>
                Reset Filters
              </Button>
            </div>
          ) : villages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {villages.map((village) => (
                <div
                  key={village._id || village.id || village.slug}
                  className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Hero Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    <img
                      src={village.heroImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80"}
                      alt={village.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gaun-green" />
                        {village.district}, {village.province}
                      </span>
                    </div>

                    {village.altitude && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-md">
                        <Mountain className="h-3.5 w-3.5 text-amber-400" />
                        <span>{village.altitude}m elevation</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-display font-bold group-hover:text-gaun-green transition-colors">
                        {village.name}
                      </h3>
                      {village.tagline && (
                        <p className="text-sm font-medium text-gaun-green italic">
                          "{village.tagline}"
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {village.description}
                      </p>
                    </div>

                    {/* Culture / Highlights Preview */}
                    {village.culture?.ethnicGroups && village.culture.ethnicGroups.length > 0 && (
                      <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1.5 items-center">
                        <Sparkles className="h-3.5 w-3.5 text-gaun-green" />
                        <span className="text-xs text-muted-foreground">Community:</span>
                        {village.culture.ethnicGroups.slice(0, 3).map((grp) => (
                          <span
                            key={grp}
                            className="text-[11px] bg-secondary px-2 py-0.5 rounded text-foreground font-medium"
                          >
                            {grp}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer / CTA */}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Home className="h-4 w-4 text-gaun-green" />
                        <span>
                          {village.homestayCount ?? (village.listings ? village.listings.length : "Verified")} Stays
                        </span>
                      </div>
                      <Link
                        to={`/villages/${village.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-gaun-green hover:text-gaun-light-green transition-colors"
                      >
                        Explore Village
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-border max-w-lg mx-auto p-8 space-y-4">
              <Compass className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-display font-semibold">No villages matched your search</h3>
              <p className="text-sm text-muted-foreground">
                Try searching for a different province or clear your search terms to explore all destinations.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProvince("All Provinces");
                  setSearchQuery("");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
