import { Link } from "react-router-dom";
import { Notebook as Facebook, Drama as Instagram, Battery as Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/gaubasti-logo.png"
                alt="Gau Basti"
                className="w-9 h-9 object-contain"
              />
              <span className="font-display text-2xl font-semibold text-background">
                Gau Basti
              </span>
            </Link>
            <p className="text-sm text-background/60 max-w-xs leading-relaxed">
              Discover and book authentic Nepali homestays, cottages, and unique stays in the heart of rural Nepal.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                aria-label="Facebook"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-background/20 text-background/60 hover:text-background hover:border-background/40 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-background/20 text-background/60 hover:text-background hover:border-background/40 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-background/20 text-background/60 hover:text-background hover:border-background/40 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-background mb-4">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-background/60 hover:text-background transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/listings" className="text-background/60 hover:text-background transition-colors">
                  All Stays
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/60 hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-background/60 hover:text-background transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-background mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  Safety Information
                </a>
              </li>
              <li>
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  Cancellation Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-background mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-background/60">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+977 98 275 142 82</span>
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@gaunbasti.com</span>
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Thamel, Kathmandu, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Gau Basti. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-background/50 hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/50 hover:text-background transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-background/50 hover:text-background transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
