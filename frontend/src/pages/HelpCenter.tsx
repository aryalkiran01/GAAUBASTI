import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { articlesAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, LifeBuoy, FileText, Shield, CreditCard, Home, User } from "lucide-react";
import HelpAssistant from "@/components/ai/HelpAssistant";

const CATEGORIES = [
  { key: "all", label: "All Topics", icon: FileText },
  { key: "booking", label: "Booking & Stays", icon: Home },
  { key: "payment", label: "Payments", icon: CreditCard },
  { key: "safety", label: "Safety & Security", icon: Shield },
  { key: "account", label: "Account", icon: User },
];

const FAQS = [
  {
    q: "How do I book a homestay?",
    a: "Browse listings, select your dates, check availability, and click Reserve. You'll be redirected to payment to complete your booking.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellation policies vary by listing. You'll see the policy and any applicable refund amounts before confirming your cancellation.",
  },
  {
    q: "How do I contact a host before booking?",
    a: "On any listing page, click 'Message host' to start a conversation. You must be logged in to send messages.",
  },
  {
    q: "Is my payment secure?",
    a: "All payments are processed through secure payment gateways. Your card details are never stored on our servers.",
  },
  {
    q: "What if I have an issue during my stay?",
    a: "You can message your host directly, create a support ticket, or raise a dispute for serious issues. Our support team is available to help.",
  },
  {
    q: "How do I become a verified host?",
    a: "Go to your Host Dashboard and submit a verification request with your ID details. Our admin team will review it within 2-3 business days.",
  },
];

const HelpCenter = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const params: any = {};
        if (activeCategory !== "all") params.category = activeCategory;
        if (search) params.search = search;
        const res = await articlesAPI.getArticles(params);
        if (res.success && res.data?.articles) {
          setArticles(res.data.articles);
        } else {
          setArticles([]);
        }
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen py-12">
      <SEO title="Help Center" description="Find answers to common questions and get support." canonicalPath="/help" />
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gaun-green/10 mb-4">
            <LifeBuoy className="h-8 w-8 text-gaun-green" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Help Center</h1>
          <p className="text-muted-foreground">Find answers, browse articles, or ask our AI assistant</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
                className={activeCategory === cat.key ? "bg-gaun-green hover:bg-gaun-light-green" : ""}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="space-y-4 mb-10">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid gap-4 mb-10">
            {articles.map((article) => (
              <Card key={article._id || article.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.content?.substring(0, 200)}
                    {article.content?.length > 200 ? "..." : ""}
                  </p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-gaun-cream/60">
                    {article.category}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 mb-10 border rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No articles found. Try a different search or category.</p>
          </div>
        )}

        {/* FAQs */}
        <div className="mb-10">
          <h2 className="text-xl font-serif font-semibold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="bg-white rounded-lg border">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="px-4 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* AI Assistant */}
        <div className="mb-6">
          <h2 className="text-xl font-serif font-semibold mb-4">Ask Our AI Assistant</h2>
          <Card>
            <CardContent className="pt-6">
              <HelpAssistant question="" />
            </CardContent>
          </Card>
        </div>

        {/* Contact link */}
        <div className="text-center border rounded-lg p-6">
          <p className="text-muted-foreground mb-3">Still need help?</p>
          <Button asChild className="bg-gaun-green hover:bg-gaun-light-green">
            <a href="/contact">Contact Support</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
