import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Languages, Copy } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Translation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [from, setFrom] = useState<"en" | "ne">("en");
  const [to, setTo] = useState<"en" | "ne">("ne");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ translated: string; original: string } | null>(null);

  if (!user) return null;

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await aiAPI.translate(text, from, to);
      if (response.success) {
        setResult({ translated: response.data.translated, original: response.data.original });
      } else {
        setError(response.message || "Translation failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (result) setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Languages className="h-5 w-5 text-gaun-green" />
          AI Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as "en" | "ne")}
            className="text-sm border rounded-md px-2 py-1.5"
          >
            <option value="en">English</option>
            <option value="ne">Nepali</option>
          </select>
          <Button variant="ghost" size="sm" onClick={swap} className="px-2">
            <Languages className="h-4 w-4" />
          </Button>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as "en" | "ne")}
            className="text-sm border rounded-md px-2 py-1.5"
          >
            <option value="en">English</option>
            <option value="ne">Nepali</option>
          </select>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Enter text to translate from ${from === "en" ? "English" : "Nepali"}...`}
          className="min-h-[100px]"
        />

        <Button onClick={handleTranslate} disabled={loading || !text.trim()} className="bg-gaun-green hover:bg-gaun-light-green">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Languages className="h-4 w-4 mr-2" />}
          {loading ? "Translating..." : "Translate"}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Original ({from === "en" ? "English" : "Nepali"}):</p>
              <p className="text-sm">{result.original}</p>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Translation ({to === "en" ? "English" : "Nepali"}):</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(result.translated);
                    toast({ title: "Copied" });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm">{result.translated}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Translation;
