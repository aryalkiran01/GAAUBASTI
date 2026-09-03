import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Sparkles } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/types";

const SemanticSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Record<string, string | string[]> | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!user) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    try {
      const response = await aiAPI.semanticSearch(query);
      if (response.success) {
        setResults((response.data.listings || []) as Listing[]);
        setFilters(response.data.filters);
      } else {
        setError(response.message || "Search failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-gaun-green" />
          AI Property Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Describe what you're looking for in plain English. Example: "cheap homestay in Pokhara with 2 bedrooms and WiFi"
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your ideal stay..."
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()} className="bg-gaun-green hover:bg-gaun-light-green shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {filters && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0)).map(([key, value]) => (
              <span key={key} className="text-xs px-2 py-0.5 rounded-full bg-muted border">
                {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
              </span>
            ))}
          </div>
        )}

        {hasSearched && !loading && results.length === 0 && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">No listings matched your search. Try different keywords.</p>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SemanticSearch;
