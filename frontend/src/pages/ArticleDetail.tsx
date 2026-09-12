import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { articlesAPI, villageAPI } from "@/lib/api";
import { Article, Village } from "@/types";
import SEO, { getArticleSchema } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import ArticleContentRenderer from "@/components/ArticleContentRenderer";
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
  Sparkles,
  Tag,
} from "lucide-react";
import { format } from "date-fns";

const DEFAULT_ARTICLE_COVER = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80";
const DEFAULT_AUTHOR_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80";

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
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <BookOpen className="h-8 w-8" />
        </div>
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
    <article className="min-h-screen bg-background pb-20">
      <SEO
        title={`${article.title} | Gaun Basti Journal`}
        description={
          article.summary ||
          article.content.substring(0, 160) ||
          "Read authentic stories and guides on Nepal village homestays and culture."
        }
        canonicalPath={`/articles/${article.slug}`}
        image={article.coverImage || DEFAULT_ARTICLE_COVER}
        type="article"
        schema={getArticleSchema({
          id: article.id || (article as any)._id,
          slug: article.slug,
          title: article.title,
          excerpt: article.summary,
          coverImage: article.coverImage || DEFAULT_ARTICLE_COVER,
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

      {/* Breadcrumb Navigation Bar */}
      <div className="container max-w-4xl pt-8 pb-4">
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-gaun-green transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to all stories & journal</span>
        </Link>
      </div>

      {/* Article Header Container */}
      <header className="container max-w-4xl space-y-6 pb-8">
        {/* Category & Metadata Pills */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full font-semibold bg-gaun-green/10 text-gaun-green border border-gaun-green/20 capitalize shadow-xs">
            <Sparkles className="h-3 w-3" />
            {article.category.replace("-", " ")}
          </span>

          {article.readingTime && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 text-muted-foreground font-medium">
              <Clock className="h-3.5 w-3.5 text-gaun-green" />
              {article.readingTime}
            </span>
          )}

          {article.createdAt && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 text-muted-foreground font-medium">
              <Calendar className="h-3.5 w-3.5 text-gaun-green" />
              {format(new Date(article.createdAt), "MMMM d, yyyy")}
            </span>
          )}

          {associatedVillage && (
            <Link
              to={`/villages/${associatedVillage.slug}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/80 text-foreground hover:text-gaun-green font-medium transition-colors"
            >
              <MapPin className="h-3 w-3 text-gaun-green" />
              <span>{associatedVillage.name}</span>
            </Link>
          )}
        </div>

        {/* Article Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground leading-[1.18] text-balance">
          {article.title}
        </h1>

        {/* Lead Summary Excerpt */}
        {article.summary && (
          <div className="border-l-3 border-gaun-green pl-4 sm:pl-5 py-1">
            <p className="text-lg sm:text-xl text-muted-foreground/90 font-serif italic leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        {/* Author Bio & Social Sharing Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <img
              src={article.author?.avatar || DEFAULT_AUTHOR_AVATAR}
              alt={article.author?.name || "Author"}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AUTHOR_AVATAR;
              }}
              className="w-12 h-12 rounded-full object-cover border-2 border-border shadow-xs shrink-0"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {article.author?.name || "Gaun Basti Editorial"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {article.author?.role || "Cultural Contributor & Researcher"}
              </p>
            </div>
          </div>

          {/* Social Share Group */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1 hidden sm:flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5 text-gaun-green" />
              Share:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 px-3 text-xs hover:text-green-600 hover:border-green-300 font-medium"
              title="Share on WhatsApp"
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTwitter}
              className="h-8 px-3 text-xs hover:text-blue-400 hover:border-blue-300 font-medium"
              title="Share on X"
            >
              X
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareFacebook}
              className="h-8 px-3 text-xs hover:text-blue-600 hover:border-blue-300 font-medium"
              title="Share on Facebook"
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 px-2.5 text-xs hover:border-gaun-green"
              title="Copy Article Link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-gaun-green" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Cover Image */}
      {article.coverImage && (
        <section className="container max-w-4xl mb-12">
          <div className="aspect-[21/10] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-lg border border-border/80 bg-secondary relative group">
            <img
              src={article.coverImage}
              alt={article.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_ARTICLE_COVER;
              }}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
            />
          </div>
        </section>
      )}

      {/* Main Body Prose */}
      <main className="container max-w-3xl space-y-10">
        <ArticleContentRenderer
          content={article.content}
          className="text-[17px] sm:text-[18px] leading-[1.85]"
        />

        {/* Hashtags / Topics */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-8 border-t border-border space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5 text-gaun-green" />
              <span>Explore Topics</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-secondary/80 hover:bg-gaun-green/10 hover:text-gaun-green border border-border hover:border-gaun-green/30 transition-all cursor-default shadow-2xs"
                >
                  <span className="text-gaun-green font-bold mr-0.5">#</span>
                  {tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Associated Destination / Village Card */}
        {associatedVillage && (
          <div className="my-10 p-6 sm:p-7 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-md flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-44 h-36 rounded-2xl overflow-hidden bg-secondary shrink-0 shadow-xs">
              <img
                src={associatedVillage.heroImage || DEFAULT_ARTICLE_COVER}
                alt={associatedVillage.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_ARTICLE_COVER;
                }}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gaun-green bg-gaun-green/10 px-2.5 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" />
                <span>Featured Heritage Village</span>
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-foreground">
                Experience {associatedVillage.name} Homestays
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {associatedVillage.description}
              </p>
              <div className="pt-1">
                <Link to={`/villages/${associatedVillage.slug}`}>
                  <Button size="sm" className="bg-gaun-green hover:bg-gaun-light-green text-white text-xs font-semibold shadow-xs">
                    Explore {associatedVillage.name} Stays
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <section className="container max-w-4xl mt-16 pt-12 border-t border-border space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold tracking-tight">Related Stories & Guides</h2>
            <Link
              to="/articles"
              className="text-xs font-semibold text-gaun-green hover:underline flex items-center gap-1"
            >
              View all stories
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel._id || rel.id || rel.slug}
                to={`/articles/${rel.slug}`}
                className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden bg-secondary relative">
                  <img
                    src={rel.coverImage || DEFAULT_ARTICLE_COVER}
                    alt={rel.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_ARTICLE_COVER;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white uppercase tracking-wider">
                      {rel.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base leading-snug group-hover:text-gaun-green transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                      {rel.summary || rel.content.substring(0, 90)}...
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{rel.readingTime || "5 min read"}</span>
                    <span className="text-gaun-green font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Read story <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

