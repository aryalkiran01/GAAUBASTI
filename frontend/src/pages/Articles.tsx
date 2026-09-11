/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { articlesAPI } from "@/lib/api";
import { Article } from "@/types";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  MapPin,
  Compass,
} from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  { id: "all", label: "All Stories" },
  { id: "culture", label: "Culture & Living Traditions" },
  { id: "food", label: "Local Flavors & Food" },
  { id: "heritage", label: "Architecture & Heritage" },
  { id: "travel-guide", label: "Travel Guides & Tips" },
];

export default function Articles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (selectedCategory !== "all") {
          params.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        const res = await articlesAPI.getArticles(params);
        if (res.success && res.data) {
          setArticles(res.data.articles || []);
        } else {
          setError(res.message || "Failed to load articles.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedCategory, searchQuery]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams);
    if (catId === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", catId);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set("q", searchQuery.trim());
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  };

  const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];
  const regularArticles = featuredArticle
    ? articles.filter((a) => (a._id || a.id) !== (featuredArticle._id || featuredArticle.id))
    : articles;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Stories & Cultural Journal | Gaun Basti"
        description="Discover authentic stories of Nepali village life, Himalayan heritage, organic mountain cuisine, and sustainable travel guides."
        canonicalPath="/articles"
      />

      {/* Hero Section */}
      <section className="relative bg-secondary/50 py-16 md:py-20 border-b border-border">
        <div className="container max-w-4xl text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gaun-green/10 text-gaun-green text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Gaun Basti Heritage Journal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-foreground">
            Stories from the Heart of the Hills
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Immerse yourself in authentic chronicles of Nepal’s rural traditions, time-honored recipes, artisan architecture, and mindful travel guides.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-md mx-auto flex items-center bg-card border border-border shadow-sm rounded-full p-1 focus-within:ring-2 focus-within:ring-gaun-green transition-all"
          >
            <div className="flex items-center pl-3 text-muted-foreground flex-1">
              <Search className="h-4 w-4 mr-2" />
              <Input
                type="text"
                placeholder="Search stories, recipes, or traditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="rounded-full px-5 bg-gaun-green hover:bg-gaun-light-green text-white text-xs"
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 md:py-14">
        <div className="container space-y-10">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.id
                    ? "bg-gaun-green text-white border-gaun-green shadow-sm"
                    : "bg-secondary/70 hover:bg-secondary border-border text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-8">
              <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-secondary/30 rounded-2xl border border-border p-8">
              <p className="text-destructive font-medium mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory("all")}>
                Reset Category
              </Button>
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-12">
              {/* Featured Article Banner */}
              {featuredArticle && !searchQuery && (
                <div className="group relative rounded-3xl overflow-hidden border border-border bg-card shadow-lg grid grid-cols-1 lg:grid-cols-12 hover:shadow-xl transition-all">
                  <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto overflow-hidden bg-secondary">
                    <img
                      src={featuredArticle.coverImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80"}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gaun-green/10 text-gaun-green capitalize">
                          {featuredArticle.category.replace("-", " ")}
                        </span>
                        {featuredArticle.readingTime && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {featuredArticle.readingTime}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight group-hover:text-gaun-green transition-colors">
                        <Link to={`/articles/${featuredArticle.slug}`}>
                          {featuredArticle.title}
                        </Link>
                      </h2>
                      <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                        {featuredArticle.summary || featuredArticle.content.substring(0, 160)}...
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      {featuredArticle.author && (
                        <div className="flex items-center gap-2">
                          <img
                            src={featuredArticle.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt={featuredArticle.author.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{featuredArticle.author.name}</p>
                            <p className="text-[10px] text-muted-foreground">{featuredArticle.author.role}</p>
                          </div>
                        </div>
                      )}
                      <Link
                        to={`/articles/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gaun-green hover:underline"
                      >
                        Read Article
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularArticles.map((article) => (
                  <article
                    key={article._id || article.id || article.slug}
                    className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                      <img
                        src={article.coverImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80"}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md capitalize">
                          {article.category.replace("-", " ")}
                        </span>
                        {article.villageSlug && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gaun-green text-white flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {article.villageSlug}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {article.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(article.createdAt), "MMM d, yyyy")}
                            </span>
                          )}
                          {article.readingTime && (
                            <span>• {article.readingTime}</span>
                          )}
                        </div>
                        <h3 className="text-lg font-display font-bold leading-snug group-hover:text-gaun-green transition-colors">
                          <Link to={`/articles/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {article.summary || article.content.substring(0, 140)}...
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        {article.author ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={article.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                              alt={article.author.name}
                              className="w-6 h-6 rounded-full object-cover border"
                            />
                            <span className="text-xs font-medium text-muted-foreground">{article.author.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Gaun Basti Editorial</span>
                        )}
                        <Link
                          to={`/articles/${article.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gaun-green hover:underline"
                        >
                          Read
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-secondary/30 rounded-2xl border border-border max-w-md mx-auto p-8 space-y-3">
              <Compass className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="text-base font-display font-semibold">No stories found</h3>
              <p className="text-xs text-muted-foreground">
                Try searching with different terms or select "All Stories" to explore all articles.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
