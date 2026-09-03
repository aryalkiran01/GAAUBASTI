import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface MessageReplySuggestionsProps {
  conversationId: string;
  onReplySelect: (text: string) => void;
}

const MessageReplySuggestions = ({ conversationId, onReplySelect }: MessageReplySuggestionsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ text: string; tone: string }[]>([]);

  if (!user) return null;

  const handleGet = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const response = await aiAPI.suggestMessageReplies(conversationId);
      if (response.success) {
        setSuggestions(response.data.suggestions || []);
      } else {
        setError(response.message || "Failed to get suggestions");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleGet}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gaun-green hover:text-gaun-light-green transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? "Generating..." : "Suggest replies"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                onReplySelect(s.text);
                setSuggestions([]);
              }}
              className="block w-full text-left p-2 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
            >
              <span className="text-xs text-muted-foreground capitalize">{s.tone}: </span>
              {s.text}
            </button>
          ))}
          <p className="text-xs text-muted-foreground italic">Tap a suggestion to use it. Edit before sending.</p>
        </div>
      )}
    </div>
  );
};

export default MessageReplySuggestions;
