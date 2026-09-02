import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { articlesAPI } from "@/lib/api";
import { Search, FileText, ArrowRight, LifeBuoy } from "lucide-react";

export default function HelpCenter() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await articlesAPI.getArticles({ published: true });
        if (response.success) {
          setArticles(response.data.articles);
        }
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map((a) => a.category))];

  return (
    <div className="min-h-screen">
      <section className="bg-secondary/50 py-16 md:py-20 border-b border-border">
        <div className="container text-center max-w-2xl mx-auto">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <LifeBuoy className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
            How can we help?
          </h1>
          <p className="text-muted-foreground mb-6">
            Search our help articles or browse by category
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search help articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-12">
              {categories.map((category) => (
                <div key={category}>
                  <h2 className="text-xl font-display font-semibold mb-5 capitalize">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered
                      .filter((a) => a.category === category)
                      .map((article) => (
                        <Link
                          key={article._id || article.id}
                          to={`/help/${article.slug}`}
                          className="bg-white border border-border rounded-2xl p-5 hover:shadow-md transition-shadow group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {article.content?.replace(/[#*]/g, "").slice(0, 120)}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {search ? "No articles found matching your search." : "No help articles are available yet."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
