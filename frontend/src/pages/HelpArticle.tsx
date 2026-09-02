import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { articlesAPI } from "@/lib/api";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function HelpArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await articlesAPI.getArticleBySlug(slug!);
        if (response.success) {
          setArticle(response.data.article);
        } else {
          setError(response.message || "Article not found");
        }
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="container max-w-3xl py-12">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container max-w-3xl py-16 text-center">
        <h1 className="text-2xl font-display font-semibold mb-3">
          {error || "Article not found"}
        </h1>
        <Link to="/help">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <Link to="/help" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Help Center
      </Link>

      <div className="mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-primary capitalize">
          {article.category}
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-6">
        {article.title}
      </h1>

      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {article.content}
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">
          Last updated: {new Date(article.lastUpdated || article.updatedAt).toLocaleDateString()}
        </p>
        <Link to="/help">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
