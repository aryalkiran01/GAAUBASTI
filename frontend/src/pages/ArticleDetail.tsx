/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { articlesAPI, villageAPI } from "@/lib/api";
import { Article, Village } from "@/types";
import SEO, { getArticleSchema } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Share2,
  Copy,
  Check,
  MapPin,
  ArrowRight,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [associatedVillage, setAssociatedVillage] = useState<Village | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await articlesAPI.getArticleBySlug(slug);
        if (res.success && res.data?.article) {
          const art = res.data.article;
          setArticle(art);
          setRelatedArticles(res.data.relatedArticles || []);

          if (art.villageSlug) {
            villageAPI.getVillageBySlug(art.villageSlug).then((vRes) => {
              if (vRes.success && vRes.data?.village) {
                setAssociatedVillage(vRes.data.village);
              }
            }).catch(() => {});
          }
        } else {
          setError(res.message || "Article not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load article.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${article?.title} — Gaun Basti`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${article?.title}: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container text-center space-y-4">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-display font-bold">Story Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {error || "We could not find the article you are looking for."}
        </p>
        <Link to="/articles">
          <Button size="sm" className="bg-gaun-green hover:bg-gaun-light-green text-white">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to All Stories
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEO
        title={`${article.title} | Gaun Basti Journal`}
        description={
          article.summary ||
          article.content.substring(0, 160) ||
          "Read authentic stories and guides on Nepal village homestays and culture."
        }
        canonicalPath={`/articles/${article.slug}`}
        image={article.coverImage}
        type="article"
        schema={getArticleSchema({
          id: article.id || (article as any)._id,
          slug: article.slug,
          title: article.title,
          excerpt: article.summary,
          coverImage: article.coverImage,
          author: article.author,
          createdAt: article.createdAt,
          updatedAt: (article as any).updatedAt
        })}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Stories & Journal", url: "/articles" },
          { name: article.title, url: `/articles/${article.slug}` }
        ]}
      />

      {/* Back Button */}
      <div className="container max-w-4xl pt-6 pb-4">
        <Link
          to="/articles"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-gaun-green transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Stories
        </Link>
      </div>

      {/* Article Header */}
      <header className="container max-w-4xl space-y-4 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gaun-green/10 text-gaun-green capitalize">
            {article.category.replace("-", " ")}
          </span>
          {article.readingTime && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.readingTime}
            </span>
          )}
          {article.createdAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(article.createdAt), "MMMM d, yyyy")}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight leading-tight">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-sans">
            {article.summary}
          </p>
        )}

        {/* Author & Social Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={article.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
              alt={article.author?.name || "Author"}
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{article.author?.name || "Gaun Basti Editorial"}</p>
              <p className="text-xs text-muted-foreground">{article.author?.role || "Cultural Contributor"}</p>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              Share:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 px-2.5 text-xs hover:text-green-600"
              title="Share on WhatsApp"
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTwitter}
              className="h-8 px-2.5 text-xs hover:text-blue-400"
              title="Share on X"
            >
              X
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareFacebook}
              className="h-8 px-2.5 text-xs hover:text-blue-600"
              title="Share on Facebook"
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 px-2 text-xs"
              title="Copy Article Link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImage && (
        <section className="container max-w-4xl mb-10">
          <div className="aspect-[21/10] rounded-3xl overflow-hidden shadow-md bg-secondary">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Main Body Prose */}
      <main className="container max-w-3xl space-y-8">
        <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed whitespace-pre-line space-y-4">
          {article.content}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-border flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-muted-foreground">Topics:</span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-secondary px-3 py-1 rounded-full text-foreground font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Associated Village Card */}
        {associatedVillage && (
          <div className="my-8 p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <img
              src={associatedVillage.heroImage}
              alt={associatedVillage.name}
              className="w-full sm:w-36 h-28 object-cover rounded-xl shrink-0"
            />
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-semibold text-gaun-green">
                <MapPin className="h-3.5 w-3.5" />
                <span>Featured Destination: {associatedVillage.name}</span>
              </div>
              <h3 className="text-lg font-display font-bold">
                Experience {associatedVillage.name} Homestays
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {associatedVillage.description}
              </p>
              <Link to={`/villages/${associatedVillage.slug}`}>
                <Button size="sm" className="mt-2 bg-gaun-green hover:bg-gaun-light-green text-white text-xs">
                  Explore {associatedVillage.name}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="container max-w-4xl mt-16 pt-12 border-t border-border space-y-6">
          <h2 className="text-2xl font-display font-bold">Related Stories & Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel._id || rel.id || rel.slug}
                to={`/articles/${rel.slug}`}
                className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[16/10] overflow-hidden bg-secondary">
                  <img
                    src={rel.coverImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80"}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-gaun-green uppercase tracking-wider">
                    {rel.category}
                  </span>
                  <h3 className="font-display font-semibold text-sm leading-snug group-hover:text-gaun-green transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {rel.summary || rel.content.substring(0, 80)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
