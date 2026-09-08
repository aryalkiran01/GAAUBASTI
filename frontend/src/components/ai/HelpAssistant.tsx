import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, MessageSquare } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const HelpAssistant = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ answer: string; found: boolean } | null>(null);

  if (!user) return null;

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await aiAPI.helpAssistant(question);
      if (response.success) {
        setAnswer({ answer: response.data.answer, found: response.data.found });
      } else {
        setError(response.message || "Failed to get answer");
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
          <Sparkles className="h-5 w-5 text-gaun-green" />
          AI Help Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ask a question about using Gau Basti. Answers are based only on our Help Center articles.
        </p>
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., How do I cancel a booking?"
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <Button onClick={handleAsk} disabled={loading || !question.trim()} className="bg-gaun-green hover:bg-gaun-light-green shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {answer && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-sm">{answer.answer}</p>
            {!answer.found && (
              <p className="text-xs text-muted-foreground mt-2">
                This answer may not fully address your question. Please contact support for more help.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HelpAssistant;
