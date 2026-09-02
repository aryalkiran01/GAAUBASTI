import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Eye, MessageSquare, TriangleAlert as AlertTriangle, Phone, CircleCheck as CheckCircle2 } from "lucide-react";

export default function SafetyInfo() {
  return (
    <div className="min-h-screen">
      <section className="bg-secondary/50 py-16 md:py-20 border-b border-border">
        <div className="container text-center max-w-2xl mx-auto">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
            Safety at Gau Basti
          </h1>
          <p className="text-muted-foreground text-lg">
            Your safety and well-being are our top priority
          </p>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: Eye,
                title: "Verified Listings",
                desc: "Every listing is reviewed and verified by our admin team before going live. We check photos, host identity, and property details.",
              },
              {
                icon: MessageSquare,
                title: "Secure Messaging",
                desc: "Communicate with hosts through our in-app messaging system. Your contact details stay private until you choose to share them.",
              },
              {
                icon: Shield,
                title: "Safe Payments",
                desc: "All payments are processed securely through Stripe. Your card information is never stored on our servers.",
              },
              {
                icon: AlertTriangle,
                title: "Report System",
                desc: "Found something suspicious? Use our reporting tools to flag listings, messages, or users for our team to review.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-2xl p-6">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">Safety tips for travelers</h2>
            <ul className="space-y-3">
              {[
                "Always communicate and pay through the Gau Basti platform",
                "Read reviews from other travelers before booking",
                "Verify the listing details and photos match the description",
                "Share your travel itinerary with family or friends",
                "Keep emergency contact numbers handy during your stay",
                "Trust your instincts — if something feels off, report it",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-display font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Emergency Contacts
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              If you are in immediate danger, contact local emergency services first.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Police:</span>
                <span className="text-muted-foreground">100</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ambulance:</span>
                <span className="text-muted-foreground">102</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tourist Police (Nepal):</span>
                <span className="text-muted-foreground">+977 1 4226430</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/contact">
              <Button size="lg">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
