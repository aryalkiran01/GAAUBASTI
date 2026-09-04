import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface ListingDescriptionGeneratorProps {
  initialData?: {
    title?: string;
    category?: string;
    location?: string;
    amenities?: string[];
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
  };
  onApply: (data: { title: string; description: string }) => void;
}

const ListingDescriptionGenerator = ({ initialData, onApply }: ListingDescriptionGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; description: string } | null>(null);
  const [notes, setNotes] = useState("");

  const canUse = user && (user.role === "host" || user.role === "admin");

  if (!canUse) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await aiAPI.generateListingDescription({
        ...initialData,
        notes,
      });
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || "Failed to generate description");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setResult(null);
      toast({ title: "Applied", description: "AI-generated content has been added to your form. Review and edit as needed." });
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-gaun-green" />
        <h4 className="text-sm font-medium">AI Description Generator</h4>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="ai-notes" className="text-xs">Additional notes (optional)</Label>
          <Input
            id="ai-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., mountain views, organic farm, family-friendly"
            className="text-sm mt-1"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
          {loading ? "Generating..." : "Generate Description"}
        </Button>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <X className="h-3 w-3" /> {error}
          </p>
        )}

        {result && (
          <div className="space-y-2 border rounded-md p-3 bg-background">
            <div>
              <Label className="text-xs">Generated Title</Label>
              <p className="text-sm font-medium mt-0.5">{result.title}</p>
            </div>
            <div>
              <Label className="text-xs">Generated Description</Label>
              <Textarea
                value={result.description}
                onChange={(e) => setResult({ ...result, description: e.target.value })}
                className="text-sm mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApply} size="sm" className="bg-gaun-green hover:bg-gaun-light-green">
                <Check className="h-3.5 w-3.5 mr-1" /> Apply
              </Button>
              <Button onClick={() => setResult(null)} variant="outline" size="sm">
                Discard
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Review and edit before applying. This is a suggestion, not final content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDescriptionGenerator;
