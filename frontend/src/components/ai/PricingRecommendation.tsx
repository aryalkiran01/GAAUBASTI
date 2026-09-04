import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface PricingRecommendationProps {
  listingId: string;
  currentPrice: number;
}

const PricingRecommendation = ({ listingId, currentPrice }: PricingRecommendationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!user || (user.role !== "host" && user.role !== "admin")) return null;

  const handleGet = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await aiAPI.pricingRecommendation(listingId);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || "Failed to get recommendation");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-gaun-green" />
          AI Pricing Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Current price: <span className="font-medium">${currentPrice}/night</span>
        </p>
        <Button onClick={handleGet} disabled={loading} className="bg-gaun-green hover:bg-gaun-light-green">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {loading ? "Analyzing..." : "Get Recommendation"}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recommended Price</span>
              <span className="text-2xl font-bold text-gaun-green">
                ${result.recommendedPrice}<span className="text-sm font-normal text-muted-foreground">/night</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                result.confidence === "high" ? "bg-green-100 text-green-800" :
                result.confidence === "medium" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {result.confidence}
              </span>
              {result.comparableCount !== undefined && (
                <span className="text-xs text-muted-foreground">({result.comparableCount} comparable listings)</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            <p className="text-xs text-muted-foreground italic">
              This is a suggestion based on marketplace data. You decide the final price.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingRecommendation;
