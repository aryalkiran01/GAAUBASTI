import { useEffect } from "react";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  schema?: Record<string, any> | Record<string, any>[];
  breadcrumbs?: BreadcrumbItem[];
}

const SITE_NAME = "Gau Basti";
const DEFAULT_IMAGE = "/gaubasti-logo.png";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://gaunbasti.com";

export default function SEO({
  title,
  description = "Discover and book authentic Nepali homestays, cottages, and unique stays in the heart of rural Nepal.",
  canonicalPath,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  schema,
  breadcrumbs,
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = canonicalPath
    ? `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
    : typeof window !== "undefined"
    ? window.location.href
    : BASE_URL;
  const imageUrl = image.startsWith("http") ? image : `${BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);

    let canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonical);

    let robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement("meta");
      robotsEl.setAttribute("name", "robots");
      document.head.appendChild(robotsEl);
    }
    robotsEl.setAttribute("content", noindex ? "noindex, nofollow" : "index, follow");

    // JSON-LD Structured Data Schema handling
    const scriptId = "gaunbasti-jsonld-schema";
    let scriptEl = document.head.querySelector<HTMLScriptElement>(`#${scriptId}`);

    const structuredDataArray: Record<string, any>[] = [];

    if (breadcrumbs && breadcrumbs.length > 0) {
      structuredDataArray.push(getBreadcrumbSchema(breadcrumbs));
    }

    if (schema) {
      if (Array.isArray(schema)) {
        structuredDataArray.push(...schema);
      } else {
        structuredDataArray.push(schema);
      }
    }

    if (structuredDataArray.length > 0) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = scriptId;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(
        structuredDataArray.length === 1 ? structuredDataArray[0] : structuredDataArray
      );
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      const el = document.head.querySelector(`#${scriptId}`);
      if (el) el.remove();
    };
  }, [fullTitle, description, canonical, imageUrl, type, noindex, schema, breadcrumbs]);

  return null;
}

/**
 * Schema Generators for SEO Rich Snippets
 */

export const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Gaun Basti",
  "url": "https://gaunbasti.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gaunbasti.com/listings?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const getBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith("http") ? item.url : `https://gaunbasti.com${item.url.startsWith('/') ? item.url : `/${item.url}`}`
  }))
});

export const getLodgingSchema = (listing: {
  id?: string;
  title: string;
  description?: string;
  price?: number;
  images?: string[];
  location?: {
    address?: string;
    city?: string;
    village?: string;
    district?: string;
    country?: string;
    coordinates?: { latitude?: number; longitude?: number };
  };
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  telephone?: string;
}) => {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "BedAndBreakfast",
    "name": listing.title,
    "description": listing.description || `Stay at ${listing.title} on Gaun Basti`,
    "url": `https://gaunbasti.com/listing/${listing.id}`,
    "image": listing.images && listing.images.length > 0 ? listing.images : ["https://gaunbasti.com/gaubasti-logo.png"],
    "priceRange": listing.price ? `NPR ${listing.price}` : "NPR",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": listing.location?.address || "",
      "addressLocality": listing.location?.village || listing.location?.city || "",
      "addressRegion": listing.location?.district || "",
      "addressCountry": listing.location?.country || "Nepal"
    }
  };

  if (listing.location?.coordinates?.latitude && listing.location?.coordinates?.longitude) {
    schema["geo"] = {
      "@type": "GeoCoordinates",
      "latitude": listing.location.coordinates.latitude,
      "longitude": listing.location.coordinates.longitude
    };
  }

  if (listing.rating && listing.reviewCount && listing.reviewCount > 0) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": listing.rating,
      "reviewCount": listing.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  if (listing.amenities && listing.amenities.length > 0) {
    schema["amenityFeature"] = listing.amenities.map(name => ({
      "@type": "LocationFeatureSpecification",
      "name": name,
      "value": true
    }));
  }

  return schema;
};

export const getVillageSchema = (village: {
  id?: string;
  slug?: string;
  name: string;
  tagline?: string;
  description?: string;
  heroImage?: string;
  district?: string;
  province?: string;
  location?: { coordinates?: [number, number] };
}) => {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": village.name,
    "description": village.tagline || village.description || `Explore ${village.name} village in rural Nepal`,
    "url": `https://gaunbasti.com/villages/${village.slug || village.id}`,
    "image": village.heroImage || "https://gaunbasti.com/gaubasti-logo.png",
    "touristType": ["Cultural Tourism", "Ecotourism", "Rural Tourism", "Homestay"],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": village.name,
      "addressRegion": village.district || "",
      "addressCountry": "Nepal"
    }
  };

  if (village.location?.coordinates && village.location.coordinates.length === 2) {
    schema["geo"] = {
      "@type": "GeoCoordinates",
      "latitude": village.location.coordinates[1],
      "longitude": village.location.coordinates[0]
    };
  }

  return schema;
};

export const getArticleSchema = (article: {
  id?: string;
  slug?: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  author?: { name?: string };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.excerpt || article.title,
  "image": article.coverImage || "https://gaunbasti.com/gaubasti-logo.png",
  "datePublished": article.createdAt ? new Date(article.createdAt).toISOString() : new Date().toISOString(),
  "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString(),
  "author": {
    "@type": "Person",
    "name": article.author?.name || "Gaun Basti Editorial"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Gaun Basti",
    "logo": {
      "@type": "ImageObject",
      "url": "https://gaunbasti.com/gaubasti-logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://gaunbasti.com/articles/${article.slug || article.id}`
  }
});
