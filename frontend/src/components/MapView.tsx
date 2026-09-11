/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, Compass, Layers, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fix for default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom price pin marker
const createPriceIcon = (price: number, isSelected: boolean) => {
  return L.divIcon({
    className: "custom-price-pin",
    html: `
      <div style="
        background-color: ${isSelected ? "#10b981" : "#ffffff"};
        color: ${isSelected ? "#ffffff" : "#1f2937"};
        padding: 4px 8px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        border: 2px solid ${isSelected ? "#047857" : "#e5e7eb"};
        display: flex;
        align-items: center;
        gap: 2px;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <span>$${price}</span>
      </div>
    `,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
};

interface MapViewProps {
  listings: any[];
  selectedListingId?: string | null;
  onSelectListing?: (id: string | null) => void;
  onSearchArea?: (center: { lat: number; lng: number; radiusKm: number }) => void;
  radiusKm?: number;
  centerCoords?: [number, number];
  center?: { lat: number; lng: number } | [number, number];
  zoom?: number;
  className?: string;
  enableAreaSearch?: boolean;
}

// Controller component to smoothly reposition map bounds when listings change
function MapBoundsController({
  listings,
  centerCoords,
}: {
  listings: any[];
  centerCoords?: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (centerCoords && centerCoords[0] && centerCoords[1]) {
      map.flyTo(centerCoords, 11, { duration: 1.2 });
      return;
    }

    const validMarkers = listings
      .map((l) => {
        const lat = l.location?.coordinates?.latitude ?? l.location?.geoJSON?.coordinates?.[1];
        const lng = l.location?.coordinates?.longitude ?? l.location?.geoJSON?.coordinates?.[0];
        return lat && lng ? [lat, lng] : null;
      })
      .filter(Boolean) as [number, number][];

    if (validMarkers.length > 0) {
      if (validMarkers.length === 1) {
        map.setView(validMarkers[0], 13);
      } else {
        const bounds = L.latLngBounds(validMarkers);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [listings, centerCoords, map]);

  return null;
}

// Component to track map center/zoom and allow "Search this area"
function MapEventsHandler({
  onSearchArea,
}: {
  onSearchArea?: (center: { lat: number; lng: number; radiusKm: number }) => void;
}) {
  const [hasMoved, setHasMoved] = useState(false);
  const map = useMapEvents({
    dragend: () => setHasMoved(true),
    zoomend: () => setHasMoved(true),
  });

  const handleSearchClick = () => {
    if (!onSearchArea) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    // Approximate radius in km from center to north-east corner
    const radiusMeters = center.distanceTo(bounds.getNorthEast());
    const radiusKm = Math.round((radiusMeters / 1000) * 10) / 10;

    onSearchArea({
      lat: center.lat,
      lng: center.lng,
      radiusKm: Math.max(5, Math.min(150, radiusKm)),
    });
    setHasMoved(false);
  };

  if (!hasMoved || !onSearchArea) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] shadow-lg">
      <Button
        onClick={handleSearchClick}
        variant="default"
        size="sm"
        className="bg-white text-foreground hover:bg-muted font-medium border border-border shadow-md gap-2 rounded-full px-4"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Search this area</span>
      </Button>
    </div>
  );
}

export default function MapView({
  listings,
  selectedListingId,
  onSelectListing,
  onSearchArea,
  radiusKm,
  centerCoords,
  center,
  zoom = 8,
  className = "h-[500px] w-full rounded-2xl overflow-hidden border border-border",
  enableAreaSearch = true,
}: MapViewProps) {
  // Default Nepal center (Pokhara/Annapurna region)
  const defaultCenter: [number, number] = centerCoords
    ? centerCoords
    : Array.isArray(center)
    ? center
    : center && typeof center === "object" && "lat" in center && "lng" in center
    ? [center.lat, center.lng]
    : [28.2096, 83.9856];

  const markerList = useMemo(() => {
    return listings
      .map((listing) => {
        const lat =
          listing.location?.coordinates?.latitude ??
          listing.location?.geoJSON?.coordinates?.[1];
        const lng =
          listing.location?.coordinates?.longitude ??
          listing.location?.geoJSON?.coordinates?.[0];

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

        return {
          id: listing._id || listing.id,
          title: listing.title,
          price: listing.price,
          category: listing.category,
          rating: listing.averageRating || 5.0,
          reviews: listing.reviewCount || 0,
          village: listing.location?.village || listing.location?.city,
          city: listing.location?.city,
          image: listing.images?.[0]?.url || "https://images.unsplash.com/photo-1587061949409-02df41d5e562",
          lat,
          lng,
        };
      })
      .filter(Boolean);
  }, [listings]);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapBoundsController listings={listings} centerCoords={centerCoords} />
        <MapEventsHandler onSearchArea={onSearchArea} />

        {/* Optional search radius circle indicator */}
        {radiusKm && centerCoords && (
          <Circle
            center={centerCoords}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "4 6",
            }}
          />
        )}

        {/* Listing Price Markers */}
        {markerList.map((m: any) => {
          const isSelected = selectedListingId === m.id;
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={createPriceIcon(m.price, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectListing) onSelectListing(m.id);
                },
              }}
            >
              <Popup className="listing-map-popup" closeButton={true} offset={[0, -10]}>
                <div className="w-56 p-1">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-2">
                    <img
                      src={m.image}
                      alt={m.title}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] capitalize font-medium border-none">
                      {m.category}
                    </Badge>
                  </div>
                  <h4 className="font-display font-semibold text-sm line-clamp-1 mb-1">
                    {m.title}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3 shrink-0 text-primary" />
                    <span>{m.village || m.city}, Nepal</span>
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{m.rating.toFixed(1)}</span>
                      {m.reviews > 0 && <span className="text-muted-foreground">({m.reviews})</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-primary">${m.price}</span>
                      <span className="text-[10px] text-muted-foreground">/night</span>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <Button size="sm" className="w-full text-xs h-8" asChild>
                      <Link to={`/listing/${m.id}`}>View Stay</Link>
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Counter / Info Badge */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur border border-border px-3 py-1.5 rounded-xl shadow-md text-xs font-medium flex items-center gap-2">
        <Compass className="h-3.5 w-3.5 text-primary" />
        <span>{markerList.length} Stays on Map</span>
      </div>
    </div>
  );
}
