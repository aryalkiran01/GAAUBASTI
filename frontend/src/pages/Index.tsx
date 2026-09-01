import SearchForm from "@/components/SearchForm";
import ListingCard from "@/components/ListingCard";
import { useFeaturedListings } from "@/hooks/useListings";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Compass,
  CalendarCheck,
  Heart,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  const { listings: featuredListings, loading } = useFeaturedListings();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] flex items-end pb-32 md:pb-40"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%), url('https://images.pexels.com/photos/32225790/pexels-photo-32225790.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <div className="max-w-3xl space-y-5 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold text-white leading-[1.05] tracking-tight text-balance">
              Stay somewhere
              <br />
              worth remembering.
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-xl leading-relaxed">
              Discover authentic homestays, cottages, and unique stays in the
              heart of Nepal's scenic villages.
            </p>
          </div>
        </div>
      </section>

      {/* Floating Search */}
      <section className="relative -mt-20 md:-mt-24 z-10">
        <div className="container">
          <SearchForm />
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="flex items-end justify-between mb-10 md:mb-14">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-2">
                Featured stays
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                Handpicked properties loved by our travelers
              </p>
            </div>
            <Link
              to="/listings"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              View all stays
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredListings.slice(0, 4).map((listing) => (
                <div key={listing.id} className="h-full">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 md:hidden">
            <Link to="/listings">
              <Button variant="outline" className="w-full">
                View all stays
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Destination Section */}
      <section className="py-20 md:py-28 bg-secondary/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/15501229/pexels-photo-15501229.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500"
                  alt="Traditional Nepali village"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 hidden md:block">
                <div className="bg-white rounded-2xl shadow-lg p-5 max-w-[200px]">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-sm">4.9</span>
                    <span className="text-xs text-muted-foreground">
                      avg rating
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    from 2,000+ happy travelers
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight">
                Nepal beyond the usual
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                From traditional mud houses in Bandipur to treehouses in Chitwan
                and lakeside cabins in Pokhara — every stay is a gateway to real
                Nepali village life.
              </p>
              <div className="space-y-4 pt-2">
                {[
                  {
                    icon: Compass,
                    title: "Authentic destinations",
                    desc: "Stay in real villages, not tourist traps",
                  },
                  {
                    icon: Heart,
                    title: "Local hosts, real stories",
                    desc: "Every booking supports a local family",
                  },
                  {
                    icon: MapPin,
                    title: "Curated by location",
                    desc: "Mountains, lakes, jungles, and heritage towns",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm md:text-base">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Book your stay in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                icon: Compass,
                title: "Browse",
                desc: "Explore curated homestays across Nepal's most beautiful regions.",
              },
              {
                step: "02",
                icon: CalendarCheck,
                title: "Reserve",
                desc: "Check availability and book your dates in just a few clicks.",
              },
              {
                step: "03",
                icon: Heart,
                title: "Experience",
                desc: "Arrive, settle in, and live like a local with your host family.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="font-display text-2xl font-semibold text-primary/30">
                    {item.step}
                  </span>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-secondary/50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
              Guest stories
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              What travelers say about their Gau Basti experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Our stay at the Riverside Cottage was magical. The hosts were incredibly welcoming and the home-cooked meals were a highlight of our trip!",
                name: "Kushal Thapa",
                location: "from Arghakhanchi",
                avatar: "/IMG-20250128-WA0003.jpg",
              },
              {
                quote:
                  "The mountain view from our villa was breathtaking! We enjoyed the cultural activities and learned so much about local traditions.",
                name: "Michael Jackson",
                location: "from Kantipur",
                avatar: "/IMG-20250128-WA0005.jpg",
              },
              {
                quote:
                  "Staying in the traditional mud house was the highlight of our Nepal trip. The authentic experience and warm hospitality made it unforgettable.",
                name: "Juduwa Bhai",
                location: "from Australia",
                avatar: "/IMG-20250128-WA0006.jpg",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="h-4 w-4 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-secondary shrink-0">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-28 bg-primary text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
                Ready for your Nepal adventure?
              </h2>
              <p className="text-white/70 text-base md:text-lg">
                Discover the perfect homestay for your next journey
              </p>
            </div>
            <Link to="/listings">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Browse homestays
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
