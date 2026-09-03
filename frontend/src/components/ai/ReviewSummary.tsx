import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, MessageSquareQuote } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ReviewSummaryProps {
  listingId: string;
}

const ReviewSummary = ({ listingId }: ReviewSummaryProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!user) return null;

  const handleGet = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await aiAPI.reviewSummary(listingId);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || "Failed to generate summary");
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
          <MessageSquareQuote className="h-5 w-5 text-gaun-green" />
          AI Review Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGet} disabled={loading} className="bg-gaun-green hover:bg-gaun-light-green">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {loading ? "Summarizing..." : "Summarize Reviews"}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  result.sentiment === "positive" ? "bg-green-100 text-green-800" :
                  result.sentiment === "negative" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {result.sentiment}
                </span>
              </div>
              <p className="text-sm">{result.summary}</p>
            </div>

            {result.pros && result.pros.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium">Common Praise</span>
                </div>
                <ul className="text-sm space-y-0.5">
                  {result.pros.map((pro: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-green-600 mt-0.5">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.cons && result.cons.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-medium">Common Concerns</span>
                </div>
                <ul className="text-sm space-y-0.5">
                  {result.cons.map((con: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-red-600 mt-0.5">-</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">
              AI-generated summary based on guest reviews. Read individual reviews for full details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSummary;
