/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { villageAPI } from "@/lib/api";
import { Village, Listing } from "@/types";
import SEO, { getVillageSchema } from "@/components/SEO";
import ListingCard from "@/components/ListingCard";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Mountain,
  Utensils,
  Calendar,
  Compass,
  Bus,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Heart,
  PhoneCall,
  Wifi,
  Activity,
} from "lucide-react";

export default function VillageDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [village, setVillage] = useState<Village | null>(null);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("culture");

  useEffect(() => {
    const fetchVillage = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await villageAPI.getVillageBySlug(slug);
        if (res.success && res.data?.village) {
          setVillage(res.data.village);
          setNearbyListings(res.data.nearbyListings || res.data.village.listings || []);
        } else {
          setError(res.message || "Village not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load village details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVillage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-6xl space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[420px] w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !village) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center container text-center space-y-4">
        <Compass className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-3xl font-display font-bold">Village Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          {error || "We could not find the destination you are looking for."}
        </p>
        <Link to="/villages">
          <Button className="bg-gaun-green hover:bg-gaun-light-green text-white">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to All Villages
          </Button>
        </Link>
      </div>
    );
  }

  const coordinates = village.coordinates?.coordinates;
  const villageCenter =
    coordinates && coordinates.length === 2
      ? { lat: coordinates[1], lng: coordinates[0] }
      : undefined;

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEO
        title={`${village.name}, ${village.district} — Heritage & Homestays | Gaun Basti`}
        description={
          village.seo?.metaDescription ||
          village.description?.substring(0, 160) ||
          `Explore ${village.name} in ${village.district}, Nepal. Experience authentic village life, local food, and community homestays.`
        }
        canonicalPath={`/villages/${village.slug}`}
        image={village.heroImage}
        schema={getVillageSchema({
          id: village.id || (village as any)._id,
          slug: village.slug,
          name: village.name,
          tagline: village.tagline,
          description: village.description,
          heroImage: village.heroImage,
          district: village.district,
          province: village.province,
          location: village.location
        })}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Villages", url: "/villages" },
          { name: village.name, url: `/villages/${village.slug}` }
        ]}
      />

      {/* Back Button & Breadcrumbs */}
      <div className="container pt-6 pb-4">
        <Link
          to="/villages"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-gaun-green transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          All Villages
        </Link>
      </div>

      {/* Hero Banner */}
      <section className="container mb-10">
        <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[21/9] min-h-[360px] max-h-[500px] flex items-end">
          <img
            src={village.heroImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80"}
            alt={village.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-10 text-white space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gaun-green text-white flex items-center gap-1 shadow">
                <MapPin className="h-3 w-3" />
                {village.district}, {village.province}
              </span>
              {village.altitude && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/50 backdrop-blur-md text-amber-300 flex items-center gap-1">
                  <Mountain className="h-3 w-3" />
                  {village.altitude}m elevation
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
              {village.name}
            </h1>
            {village.tagline && (
              <p className="text-base md:text-xl text-white/90 font-serif italic">
                "{village.tagline}"
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Details Grid */}
      <div className="container grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Story & Village Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
            {[
              { id: "culture", label: "Culture & Story", icon: Sparkles },
              { id: "food", label: "Local Food", icon: Utensils },
              { id: "festivals", label: "Festivals", icon: Calendar },
              { id: "activities", label: "Things to Do", icon: Activity },
              { id: "transport", label: "How to Reach", icon: Bus },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gaun-green text-white font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Culture & Heritage */}
          {activeTab === "culture" && (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-display font-bold mb-3">About {village.name}</h2>
                <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                  {village.description}
                </p>
              </div>

              {village.culture?.overview && (
                <div className="bg-secondary/40 border border-border rounded-2xl p-6 space-y-3">
                  <h3 className="text-lg font-display font-semibold flex items-center gap-2 text-gaun-green">
                    <Heart className="h-5 w-5" />
                    Living Heritage & Traditions
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {village.culture.overview}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {village.culture?.ethnicGroups && village.culture.ethnicGroups.length > 0 && (
                  <div className="p-5 border border-border rounded-2xl bg-card">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Ethnic Communities</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {village.culture.ethnicGroups.map((group) => (
                        <span key={group} className="text-xs bg-secondary px-2.5 py-1 rounded-md font-medium">
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {village.culture?.languages && village.culture.languages.length > 0 && (
                  <div className="p-5 border border-border rounded-2xl bg-card">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Languages Spoken</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {village.culture.languages.map((lang) => (
                        <span key={lang} className="text-xs bg-secondary px-2.5 py-1 rounded-md font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {village.culture?.traditions && village.culture.traditions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-display font-semibold">Local Customs & Traditions</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {village.culture.traditions.map((tradition, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-xl border border-border/50"
                      >
                        <span className="h-2 w-2 rounded-full bg-gaun-green mt-1.5 shrink-0" />
                        <span>{tradition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gallery Preview */}
              {village.gallery && village.gallery.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-lg font-display font-semibold">Village Gallery</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {village.gallery.map((imgUrl, i) => (
                      <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden border border-border">
                        <img
                          src={imgUrl}
                          alt={`${village.name} scenery ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Local Food */}
          {activeTab === "food" && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Authentic Himalayan Flavors</h2>
                <p className="text-muted-foreground text-sm">
                  Home-cooked meals prepared with organic farm ingredients grown right on the terraced fields of {village.name}.
                </p>
              </div>

              {village.localFood && village.localFood.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {village.localFood.map((food, i) => (
                    <div
                      key={i}
                      className="p-5 border border-border rounded-2xl bg-card space-y-2 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-gaun-green" />
                        <h3 className="font-display font-semibold text-lg">{food.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {food.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Organic Dal Bhat, fresh local greens (Saag), Gundruk, and local milk products are freshly served by host families.
                </p>
              )}
            </div>
          )}

          {/* Tab 3: Festivals */}
          {activeTab === "festivals" && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Festivals & Celebrations</h2>
                <p className="text-muted-foreground text-sm">
                  Experience joyous folk dances, community rituals, and authentic cultural hospitality during these annual celebrations.
                </p>
              </div>

              {village.festivals && village.festivals.length > 0 ? (
                <div className="space-y-4">
                  {village.festivals.map((fest, i) => (
                    <div
                      key={i}
                      className="p-5 border border-border rounded-2xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h3 className="font-display font-semibold text-lg">{fest.name}</h3>
                        <p className="text-sm text-muted-foreground">{fest.description}</p>
                      </div>
                      {fest.month && (
                        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gaun-green/10 text-gaun-green border border-gaun-green/20">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{fest.month}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Dashain, Tihar, Maghe Sankranti, and local harvesting festivals are celebrated with great warmth.
                </p>
              )}
            </div>
          )}

          {/* Tab 4: Activities & Things to Do */}
          {activeTab === "activities" && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Attractions & Activities</h2>
                <p className="text-muted-foreground text-sm">
                  Unforgettable experiences awaiting you in and around {village.name}.
                </p>
              </div>

              {village.activities && village.activities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Key Activities</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {village.activities.map((act, i) => (
                      <div key={i} className="p-4 border border-border rounded-xl bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-foreground">{act.title}</h4>
                          {act.difficulty && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                act.difficulty === "Easy"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                  : act.difficulty === "Moderate"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {act.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{act.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {village.attractions && village.attractions.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-base">Nearby Attractions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {village.attractions.map((attr, i) => (
                      <div key={i} className="p-4 border border-border rounded-xl bg-card space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{attr.title}</h4>
                          {attr.distance && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {attr.distance}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{attr.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Transport & How to Reach */}
          {activeTab === "transport" && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">How to Reach {village.name}</h2>
                <p className="text-muted-foreground text-sm">
                  Travel guidelines, bus routes, road conditions, and local connectivity details.
                </p>
              </div>

              <div className="bg-secondary/30 border border-border rounded-2xl p-6 space-y-4">
                {village.transport?.howToReach && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 text-gaun-green">
                      <Bus className="h-4 w-4" />
                      Travel Directions
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {village.transport.howToReach}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {village.transport?.estimatedTravelTime && (
                    <div className="p-3 bg-card border border-border rounded-xl text-xs space-y-1">
                      <span className="text-muted-foreground font-medium">Estimated Travel Time</span>
                      <p className="font-semibold text-foreground">{village.transport.estimatedTravelTime}</p>
                    </div>
                  )}
                  {village.transport?.roadCondition && (
                    <div className="p-3 bg-card border border-border rounded-xl text-xs space-y-1">
                      <span className="text-muted-foreground font-medium">Road Condition</span>
                      <p className="font-semibold text-foreground">{village.transport.roadCondition}</p>
                    </div>
                  )}
                  {village.transport?.nearestBusStop && (
                    <div className="p-3 bg-card border border-border rounded-xl text-xs space-y-1">
                      <span className="text-muted-foreground font-medium">Nearest Bus Station / Stop</span>
                      <p className="font-semibold text-foreground">{village.transport.nearestBusStop}</p>
                    </div>
                  )}
                  {village.transport?.nearestAirport && (
                    <div className="p-3 bg-card border border-border rounded-xl text-xs space-y-1">
                      <span className="text-muted-foreground font-medium">Nearest Airport</span>
                      <p className="font-semibold text-foreground">{village.transport.nearestAirport}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Information */}
              {village.safetyInfo && (
                <div className="border border-border rounded-2xl p-6 space-y-3 bg-card">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-gaun-green" />
                    Safety & Connectivity
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {village.safetyInfo.medicalFacilities && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Medical:</strong> {village.safetyInfo.medicalFacilities}</span>
                      </div>
                    )}
                    {village.safetyInfo.networkConnectivity && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Wifi className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Network:</strong> {village.safetyInfo.networkConnectivity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Quick Info & Interactive Map */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-lg">Destination Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Province</span>
                <span className="font-medium text-foreground">{village.province}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">District</span>
                <span className="font-medium text-foreground">{village.district}</span>
              </div>
              {village.altitude && (
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Altitude</span>
                  <span className="font-medium text-foreground">{village.altitude} meters</span>
                </div>
              )}
              {village.bestTimeToVisit && village.bestTimeToVisit.length > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Best Season</span>
                  <span className="font-medium text-foreground">
                    {village.bestTimeToVisit.join(", ")}
                  </span>
                </div>
              )}
            </div>

            <Link
              to={`/listings?location=${encodeURIComponent(village.name)}`}
              className="block w-full"
            >
              <Button className="w-full bg-gaun-green hover:bg-gaun-light-green text-white font-medium">
                Browse Stays in {village.name}
              </Button>
            </Link>
          </div>

          {/* Interactive Village Map */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-display font-semibold text-base flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gaun-green" />
              Village Location
            </h3>
            <div className="h-[280px] rounded-xl overflow-hidden border border-border">
              <MapView
                listings={nearbyListings}
                center={villageCenter}
                zoom={13}
                enableAreaSearch={false}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Coordinates: {coordinates ? `${coordinates[1].toFixed(4)}° N, ${coordinates[0].toFixed(4)}° E` : "Nepal"}
            </p>
          </div>
        </div>
      </div>

      {/* Homestays in this village */}
      <section className="container mt-16 pt-12 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Homestays in {village.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Live with welcoming local families and support grassroots Himalayan communities.
            </p>
          </div>
          <Link to={`/listings?location=${encodeURIComponent(village.name)}`}>
            <Button variant="outline" size="sm">
              View All Homestays
            </Button>
          </Link>
        </div>

        {nearbyListings && nearbyListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nearbyListings.map((listing) => (
              <div key={listing.id || (listing as any)._id} className="h-full">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/30 rounded-2xl border border-border space-y-3">
            <p className="text-muted-foreground">
              No registered homestays yet for this exact village.
            </p>
            <Link to="/listings">
              <Button variant="outline">Explore All Stays</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
