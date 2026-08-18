import { useEffect } from 'react';

/**
 * ============================================================
 *  Dynamic SEO layer — Janaki Sky Innovations storefront
 * ============================================================
 *  Dependency-free <Seo> component that writes <head> metadata
 *  (title, description, keywords, robots, canonical, Open Graph,
 *  Twitter card) plus JSON-LD structured data straight from the
 *  current route's live data. When a product / service / category
 *  is added or edited in the admin panel, the next visit to its
 *  page automatically exposes the fresh metadata to search engines.
 *
 *  Override the site URL/name for production deploys via the
 *  VITE_SITE_URL / VITE_SITE_NAME build-time env vars (see Frontend/.env.example).
 * ============================================================
 */

export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Janaki Sky Innovations';
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.janakiskyinnovations.com').replace(/\/+$/, '');

export const DEFAULT_DESCRIPTION =
    "Janaki Sky Innovations – India's biggest online drone & electronics store. Buy drones, FPV, robotics, Arduino, sensors and DIY components with fast delivery across India.";

export const DEFAULT_KEYWORDS =
    'drones, drone store india, buy drone online, fpv, robotics, arduino, sensors, diy electronics, janaki sky innovations';

export const truncate = (value, max = 160) => {
    if (!value) return '';
    const text = String(value).replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

export const humanize = (value) =>
    String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------------- head helpers ---------------- */

const upsertMeta = (attr, key, content) => {
    const selector = `meta[${attr}="${key}"]`;
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};

const removeMeta = (attr, key) => {
    document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((el) => el.remove());
};

const upsertCanonical = (href) => {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
};

const upsertJsonLd = (key, data) => {
    const selector = `script[data-seo-jsonld="${key}"]`;
    let script = document.head.querySelector(selector);
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', key);
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
};

// JSON-LD keys managed by the Seo component (cleaned up on route change/unmount).
// Static baseline scripts placed in index.html are intentionally NOT managed.
const managedJsonLdKeys = new Set();

const removeJsonLd = (key) => {
    managedJsonLdKeys.delete(key);
    document.head.querySelectorAll(`script[data-seo-jsonld="${key}"]`).forEach((el) => el.remove());
};

/* ---------------- <Seo> component ---------------- */

const Seo = ({
    title,
    description,
    keywords,
    path = '/',
    image = '',
    ogType = 'website',
    noindex = false,
    jsonLd = null,
}) => {
    const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

    useEffect(() => {
        const cleanDescription = truncate(description || DEFAULT_DESCRIPTION, 160);
        const cleanKeywords = keywords || DEFAULT_KEYWORDS;
        const fullTitle = title ? `${truncate(title, 70)} | ${SITE_NAME}` : SITE_NAME;
        const canonical = new URL(path, SITE_URL).href;
        // Social/crawler platforms require absolute image URLs.
        const absImage = image
            ? (image.startsWith('http') || image.startsWith('//') ? image : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`)
            : '';

        document.title = fullTitle;
        upsertMeta('name', 'description', cleanDescription);
        upsertMeta('name', 'keywords', cleanKeywords);
        upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
        upsertCanonical(canonical);

        // Open Graph
        upsertMeta('property', 'og:site_name', SITE_NAME);
        upsertMeta('property', 'og:title', fullTitle);
        upsertMeta('property', 'og:description', cleanDescription);
        upsertMeta('property', 'og:type', ogType);
        upsertMeta('property', 'og:url', canonical);
        if (absImage) upsertMeta('property', 'og:image', absImage);
        else removeMeta('property', 'og:image');

        // Twitter card
        upsertMeta('name', 'twitter:card', absImage ? 'summary_large_image' : 'summary');
        upsertMeta('name', 'twitter:title', fullTitle);
        upsertMeta('name', 'twitter:description', cleanDescription);
        if (absImage) upsertMeta('name', 'twitter:image', absImage);
        else removeMeta('name', 'twitter:image');

        // JSON-LD: refresh this page's schemas, drop schemas no longer needed.
        const entries = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
        const activeKeys = new Set();
        entries.forEach((entry) => {
            if (!entry) return;
            const key = Array.isArray(entry['@type']) ? entry['@type'].join('+') : (entry['@type'] || 'schema');
            activeKeys.add(key);
            upsertJsonLd(key, entry);
            managedJsonLdKeys.add(key);
        });
        managedJsonLdKeys.forEach((key) => {
            if (!activeKeys.has(key)) removeJsonLd(key);
        });

        return () => {
            activeKeys.forEach((key) => removeJsonLd(key));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, keywords, path, image, ogType, noindex, jsonLdKey]);

    return null;
};

export default Seo;


/* ---------------- JSON-LD schema builders ---------------- */

// Breadcrumb trail, e.g. Home > Drone Category > Product Name
export const buildBreadcrumbSchema = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (items || []).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: truncate(item.name, 80),
        item: new URL(item.path, SITE_URL).href,
    })),
});

// Product rich snippet (price, stock, rating) for /product/:id
export const buildProductSchema = (product) => {
    if (!product || !product._id) return null;
    const price = Number(product.discountPrice || product.price) || 0;
    const inStock = product.forcePreOrder === true || Number(product.stock) > 0;
    const image = product.mainImage || (Array.isArray(product.gallery) && product.gallery[0]) || '';
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: truncate(product.name, 120),
        description: truncate(product.shortSummary || product.description, 300),
        sku: product.sku || undefined,
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/product/${product._id}`,
            priceCurrency: 'INR',
            price,
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
    };
    if (image) schema.image = [image];
    if (product.numReviews > 0 && product.ratings) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(product.ratings).toFixed(1),
            reviewCount: product.numReviews,
            bestRating: 5,
            worstRating: 1,
        };
    }
    return JSON.parse(JSON.stringify(schema));
};

// ItemList rich snippet for category / collection pages
export const buildItemListSchema = (name, items, pathFor) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return JSON.parse(JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: truncate(name, 120),
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: truncate(item.name, 120),
            url: `${SITE_URL}${pathFor ? pathFor(item) : `/${item._id}`}`,
        })),
    }));
};

// Single Service rich snippet
export const buildServiceSchema = (service, categoryName = '') => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: truncate(service.title || '', 120),
    description: truncate(service.description || '', 300),
    serviceType: categoryName || 'Drone Services',
    areaServed: 'IN',
    provider: { '@type': 'Organization', name: SITE_NAME },
    ...(service.image ? { image: service.image } : {}),
});

// Service category page rich snippet (includes its service catalog)
export const buildServiceCategorySchema = (category) => {
    if (!category) return null;
    const services = (category.services || [])
        .filter((s) => s && s.title)
        .slice(0, 50)
        .map((s) => buildServiceSchema(s, category.name));
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: truncate(category.name, 120),
        description: truncate(category.description || '', 300),
        serviceType: category.name,
        areaServed: 'IN',
        provider: { '@type': 'Organization', name: SITE_NAME },
    };
    if (services.length > 0) {
        schema.hasOfferCatalog = {
            '@type': 'OfferCatalog',
            name: `${category.name} Services`,
            itemListElement: services,
        };
    }
    return JSON.parse(JSON.stringify(schema));
};
