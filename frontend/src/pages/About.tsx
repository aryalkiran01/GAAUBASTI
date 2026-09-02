import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Heart, Globe, ArrowRight } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative py-24 md:py-32 flex items-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://images.pexels.com/photos/15501229/pexels-photo-15501229.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-4">
              About Gau Basti
            </h1>
            <p className="text-xl md:text-2xl text-white/85 leading-relaxed">
              Connecting travelers with authentic Nepali homestay experiences
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">Our story</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gau Basti was founded in 2020 with a simple mission: to connect travelers with authentic Nepali homestay experiences while supporting local communities.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our founders, having grown up in the beautiful villages of Nepal, recognized the unique opportunity to share the rich cultural heritage of rural Nepal with visitors from around the world.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                What started as a small initiative with just five homestays has now grown into a community of over 100 hosts across Nepal, each offering a unique glimpse into local life and traditions.
              </p>
            </div>
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/3352873/pexels-photo-3352873.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500"
                alt="Traditional Nepali home"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-28 bg-secondary/50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">Our mission</h2>
            <p className="text-muted-foreground text-lg">We believe tourism should benefit everyone it touches</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Community support", desc: "We provide economic opportunities for rural communities by connecting them with travelers, ensuring tourism benefits go directly to local families." },
              { icon: Heart, title: "Cultural preservation", desc: "We help preserve and promote Nepali traditions, architecture, and lifestyle by creating sustainable tourism that values cultural heritage." },
              { icon: Globe, title: "Authentic connections", desc: "We facilitate meaningful interactions between travelers and locals, creating rich cultural exchanges and unforgettable experiences." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-12 text-center">Meet our team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Kiran Aryal", role: "Founder & CEO", img: "/WhatsApp Image 2025-06-08 at 19.58.10_f0f236d9.jpg" },
              { name: "Kushal Thapa", role: "Co-founder & COO", img: "/IMG-20250128-WA0003.jpg" },
              { name: "Nabin Pun", role: "Technical Lead", img: "/WhatsApp Image 2025-01-28 at 21.20.36_2d6875c4.jpg" },
              { name: "Rohit Khanal", role: "Technical Manager", img: "/WhatsApp Image 2025-01-28 at 21.36.19_4ec2fbd6.jpg" },
            ].map((member) => (
              <div key={member.name} className="text-center">
                <div className="mb-4 rounded-full overflow-hidden mx-auto w-36 h-36 ring-2 ring-border">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-display font-semibold">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">Join our community</h2>
              <p className="text-white/70 text-lg">Become a host or start your adventure today</p>
            </div>
            <div className="flex gap-3">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Become a host
                </Button>
              </Link>
              <Link to="/listings">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Browse stays
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
