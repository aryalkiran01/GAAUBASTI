import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "np";

type TranslationKey =
  | "nav.home"
  | "nav.stay"
  | "nav.about"
  | "nav.contact"
  | "nav.login"
  | "nav.signup"
  | "nav.logout"
  | "nav.account"
  | "nav.messages"
  | "nav.hostDashboard"
  | "nav.adminDashboard"
  | "hero.title"
  | "hero.subtitle"
  | "search.location"
  | "search.checkin"
  | "search.guests"
  | "search.search"
  | "search.guest"
  | "search.guests_plural"
  | "listings.title"
  | "listings.subtitle"
  | "listings.available"
  | "listings.available_plural"
  | "listings.noResults"
  | "listings.noResultsDesc"
  | "listings.clearFilters"
  | "listings.filters"
  | "listings.priceRange"
  | "listings.category"
  | "listings.sortBy"
  | "listings.sortPriceLow"
  | "listings.sortPriceHigh"
  | "listings.sortRating"
  | "listings.sortNewest"
  | "listings.applyFilters"
  | "listings.loading"
  | "listings.error"
  | "listings.next"
  | "listings.prev"
  | "listings.page"
  | "detail.about"
  | "detail.amenities"
  | "detail.details"
  | "detail.bedrooms"
  | "detail.bathrooms"
  | "detail.maxGuests"
  | "detail.reviews"
  | "detail.reserve"
  | "detail.checkAvailability"
  | "detail.notAvailable"
  | "detail.creatingBooking"
  | "detail.total"
  | "detail.cleaningFee"
  | "detail.serviceFee"
  | "detail.nights"
  | "detail.night"
  | "detail.share"
  | "detail.save"
  | "detail.messageHost"
  | "account.title"
  | "account.myBookings"
  | "account.favorites"
  | "account.myListings"
  | "account.noBookings"
  | "account.noBookingsDesc"
  | "account.browseHomestays"
  | "account.noFavorites"
  | "account.noFavoritesDesc"
  | "host.title"
  | "host.totalListings"
  | "host.activeBookings"
  | "host.totalRevenue"
  | "host.myListings"
  | "host.bookings"
  | "host.reviews"
  | "host.addNewListing"
  | "host.noListings"
  | "host.noListingsDesc"
  | "host.noBookings"
  | "host.noBookingsDesc"
  | "common.loading"
  | "common.error"
  | "common.retry"
  | "common.save"
  | "common.cancel"
  | "common.delete"
  | "common.edit"
  | "common.create"
  | "common.update"
  | "common.viewDetails"
  | "common.contactHost"
  | "common.perNight";

const en: Record<TranslationKey, string> = {
  "nav.home": "Home",
  "nav.stay": "Stay",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.logout": "Log out",
  "nav.account": "Account",
  "nav.messages": "Messages",
  "nav.hostDashboard": "Host Dashboard",
  "nav.adminDashboard": "Admin Dashboard",
  "hero.title": "Stay somewhere worth remembering.",
  "hero.subtitle": "Discover authentic homestays, cottages, and unique stays in the heart of Nepal's scenic villages.",
  "search.location": "Location",
  "search.checkin": "Check-in",
  "search.guests": "Guests",
  "search.search": "Search",
  "search.guest": "Guest",
  "search.guests_plural": "Guests",
  "listings.title": "Find your perfect stay",
  "listings.subtitle": "Handpicked properties loved by our travelers",
  "listings.available": "stay available",
  "listings.available_plural": "stays available",
  "listings.noResults": "No listings found",
  "listings.noResultsDesc": "Try adjusting your search criteria or explore other locations.",
  "listings.clearFilters": "Clear filters",
  "listings.filters": "Filters",
  "listings.priceRange": "Price range",
  "listings.category": "Category",
  "listings.sortBy": "Sort by",
  "listings.sortPriceLow": "Price: Low to High",
  "listings.sortPriceHigh": "Price: High to Low",
  "listings.sortRating": "Highest Rated",
  "listings.sortNewest": "Newest",
  "listings.applyFilters": "Apply filters",
  "listings.loading": "Loading...",
  "listings.error": "Error loading listings",
  "listings.next": "Next",
  "listings.prev": "Previous",
  "listings.page": "Page",
  "detail.about": "About this place",
  "detail.amenities": "What this place offers",
  "detail.details": "Details",
  "detail.bedrooms": "Bedrooms",
  "detail.bathrooms": "Bathrooms",
  "detail.maxGuests": "Max Guests",
  "detail.reviews": "reviews",
  "detail.reserve": "Reserve",
  "detail.checkAvailability": "Check availability first",
  "detail.notAvailable": "Not available",
  "detail.creatingBooking": "Creating booking...",
  "detail.total": "Total",
  "detail.cleaningFee": "Cleaning fee",
  "detail.serviceFee": "Service fee",
  "detail.nights": "nights",
  "detail.night": "night",
  "detail.share": "Share",
  "detail.save": "Save",
  "detail.messageHost": "Message host",
  "account.title": "My Dashboard",
  "account.myBookings": "My Bookings",
  "account.favorites": "Favorites",
  "account.myListings": "My Listings",
  "account.noBookings": "No bookings yet",
  "account.noBookingsDesc": "Start exploring homestays to plan your next adventure",
  "account.browseHomestays": "Browse homestays",
  "account.noFavorites": "No favorites yet",
  "account.noFavoritesDesc": "Save homestays you love by clicking the heart icon",
  "host.title": "Host dashboard",
  "host.totalListings": "Total Listings",
  "host.activeBookings": "Active Bookings",
  "host.totalRevenue": "Total Revenue",
  "host.myListings": "My Listings",
  "host.bookings": "Bookings",
  "host.reviews": "Reviews",
  "host.addNewListing": "Add new listing",
  "host.noListings": "No listings yet",
  "host.noListingsDesc": "Create your first listing to start hosting guests",
  "host.noBookings": "No bookings yet",
  "host.noBookingsDesc": "Bookings will appear here once guests start reserving your listings",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.retry": "Try again",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.create": "Create",
  "common.update": "Update",
  "common.viewDetails": "View details",
  "common.contactHost": "Contact host",
  "common.perNight": "/ night",
};

const np: Record<TranslationKey, string> = {
  "nav.home": "गृह",
  "nav.stay": "बसाइ",
  "nav.about": "हामी बारे",
  "nav.contact": "सम्पर्क",
  "nav.login": "लग इन",
  "nav.signup": "साइन अप",
  "nav.logout": "लग आउट",
  "nav.account": "खाता",
  "nav.messages": "सन्देश",
  "nav.hostDashboard": "होस्ट ड्यासबोर्ड",
  "nav.adminDashboard": "एडमिन ड्यासबोर्ड",
  "hero.title": "सम्झना लाग्ने ठाउँमा बस्नुहोस्।",
  "hero.subtitle": "नेपालका सुन्दर गाउँहरूमा वास्तविक होमस्टे, कटेज र अनौठो बसाइ पत्ता लगाउनुहोस्।",
  "search.location": "स्थान",
  "search.checkin": "चेक-इन",
  "search.guests": "अतिथि",
  "search.search": "खोज्नुहोस्",
  "search.guest": "अतिथि",
  "search.guests_plural": "अतिथिहरू",
  "listings.title": "तपाईंको लागि उपयुक्त बसाइ खोज्नुहोस्",
  "listings.subtitle": "हाम्रा यात्रुहरूले मनपराएका छनोट गरिएका ठाउँहरू",
  "listings.available": "बसाइ उपलब्ध",
  "listings.available_plural": "बसाइहरू उपलब्ध",
  "listings.noResults": "कुनै बसाइ फेला परेन",
  "listings.noResultsDesc": "आफ्नो खोज मापदण्ड परिवर्तन गर्नुहोस् वा अन्य स्थानहरू अन्वेषण गर्नुहोस्।",
  "listings.clearFilters": "फिल्टर हटाउनुहोस्",
  "listings.filters": "फिल्टर",
  "listings.priceRange": "मूल्य दायरा",
  "listings.category": "श्रेणी",
  "listings.sortBy": "क्रमबद्ध गर्नुहोस्",
  "listings.sortPriceLow": "मूल्य: कम देखि उच्च",
  "listings.sortPriceHigh": "मूल्य: उच्च देखि कम",
  "listings.sortRating": "उच्च मूल्याङ्कन",
  "listings.sortNewest": "नवीनतम",
  "listings.applyFilters": "फिल्टर लागू गर्नुहोस्",
  "listings.loading": "लोड हुँदै...",
  "listings.error": "बसाइ लोड गर्ने क्रममा त्रुटि",
  "listings.next": "अर्को",
  "listings.prev": "अघिल्लो",
  "listings.page": "पृष्ठ",
  "detail.about": "यो ठाउँ बारे",
  "detail.amenities": "यो ठाउँले प्रदान गर्ने सुविधा",
  "detail.details": "विवरण",
  "detail.bedrooms": "बेडरूम",
  "detail.bathrooms": "बाथरूम",
  "detail.maxGuests": "अधिकतम अतिथि",
  "detail.reviews": "समीक्षा",
  "detail.reserve": "आरक्षण गर्नुहोस्",
  "detail.checkAvailability": "पहिले उपलब्धता जाँच्नुहोस्",
  "detail.notAvailable": "उपलब्ध छैन",
  "detail.creatingBooking": "आरक्षण बनाउँदै...",
  "detail.total": "कुल",
  "detail.cleaningFee": "सरसफाइ शुल्क",
  "detail.serviceFee": "सेवा शुल्क",
  "detail.nights": "रात",
  "detail.night": "रात",
  "detail.share": "साझेदारी",
  "detail.save": "सुरक्षित गर्नुहोस्",
  "detail.messageHost": "होस्टलाई सन्देश",
  "account.title": "मेरो ड्यासबोर्ड",
  "account.myBookings": "मेरो आरक्षण",
  "account.favorites": "मनपर्ने",
  "account.myListings": "मेरो सूची",
  "account.noBookings": "अहिलेसम्म कुनै आरक्षण छैन",
  "account.noBookingsDesc": "तपाईंको अर्को यात्राको योजना बनाउन होमस्टे अन्वेषण गर्न सुरु गर्नुहोस्",
  "account.browseHomestays": "होमस्टे ब्राउज गर्नुहोस्",
  "account.noFavorites": "अहिलेसम्म मनपर्ने छैन",
  "account.noFavoritesDesc": "मन परेका होमस्टे हृदय आइकनमा क्लिक गरेर सुरक्षित गर्नुहोस्",
  "host.title": "होस्ट ड्यासबोर्ड",
  "host.totalListings": "कुल सूची",
  "host.activeBookings": "सक्रिय आरक्षण",
  "host.totalRevenue": "कुल आम्दानी",
  "host.myListings": "मेरो सूची",
  "host.bookings": "आरक्षण",
  "host.reviews": "समीक्षा",
  "host.addNewListing": "नयाँ सूची थप्नुहोस्",
  "host.noListings": "अहिलेसम्म कुनै सूची छैन",
  "host.noListingsDesc": "अतिथि भित्ताउन सुरु गर्न आफ्नो पहिलो सूची बनाउनुहोस्",
  "host.noBookings": "अहिलेसम्म कुनै आरक्षण छैन",
  "host.noBookingsDesc": "अतिथिहरूले आरक्षण गर्न थालेपछि यहाँ देखिनेछ",
  "common.loading": "लोड हुँदै...",
  "common.error": "त्रुटि",
  "common.retry": "फेरि प्रयास गर्नुहोस्",
  "common.save": "सुरक्षित गर्नुहोस्",
  "common.cancel": "रद्द गर्नुहोस्",
  "common.delete": "मेटाउनुहोस्",
  "common.edit": "सम्पादन",
  "common.create": "बनाउनुहोस्",
  "common.update": "अपडेट",
  "common.viewDetails": "विवरण हेर्नुहोस्",
  "common.contactHost": "होस्टलाई सम्पर्क",
  "common.perNight": "/ रात",
};

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, np };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("locale") : null;
    return saved === "np" || saved === "en" ? saved : "en";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof localStorage !== "undefined") localStorage.setItem("locale", l);
    document.documentElement.lang = l === "np" ? "ne" : "en";
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return dictionaries[locale][key] ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
