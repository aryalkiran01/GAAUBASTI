import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ModerationResult {
  flagged: boolean;
  severity: string;
  categories: string[];
  reason: string;
}

interface AIModerationProps {
  contentType: "message" | "listing" | "review";
  content: string;
  onFlagged?: (result: ModerationResult) => void;
}

const AIModeration = ({ contentType, content, onFlagged }: AIModerationProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ModerationResult | null>(null);

  if (!user || (user.role !== "host" && user.role !== "admin")) return null;

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await aiAPI.moderateContent(contentType, content);
      if (response.success) {
        setResult(response.data as ModerationResult);
        if (onFlagged && response.data.flagged) onFlagged(response.data as ModerationResult);
      } else {
        setError(response.message || "Moderation check failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleCheck}
        disabled={loading || !content}
        variant="outline"
        size="sm"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1" />}
        {loading ? "Checking..." : "AI Safety Check"}
      </Button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {result && (
        <div className={`mt-3 border rounded-lg p-3 ${result.flagged ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.flagged ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm font-medium">
              {result.flagged ? "Flagged for review" : "No issues found"}
            </span>
            <Badge variant={result.severity === "high" ? "destructive" : "secondary"} className="text-xs">
              {result.severity}
            </Badge>
          </div>
          {result.categories && result.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {result.categories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{result.reason}</p>
          {result.flagged && (
            <p className="text-xs text-muted-foreground italic mt-2">
              This content has been flagged for human review. No automatic action will be taken.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIModeration;
