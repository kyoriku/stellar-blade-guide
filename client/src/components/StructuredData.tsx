import { useEffect } from 'react';
import { breadcrumbList, type Crumb } from '../utils/breadcrumbs';

interface StructuredDataProps {
  type?: 'WebPage' | 'Article' | 'CollectionPage';
  headline?: string;
  description?: string;
  extraSchemas?: object[];
  // The page's trail below Home, each crumb named as its page's h1. A page that
  // passes none (the home page) gets no BreadcrumbList.
  breadcrumbs?: readonly Crumb[];
}

export default function StructuredData({
  type = 'WebPage',
  headline,
  description,
  extraSchemas,
  breadcrumbs
}: StructuredDataProps) {
  const pathname = window.location.pathname;
  // Pages pass a fresh array on every render, so the effect is keyed on the
  // trail's content rather than its identity.
  const crumbsKey = breadcrumbs?.length ? JSON.stringify(breadcrumbs) : '';

  // Schemas are built inside the effect: computing them during render would
  // make fresh object identities on every render and re-run the effect.
  useEffect(() => {
    const siteUrl = 'https://stellarbladeguide.com';
    const currentUrl = `${siteUrl}${pathname}`;

    const websiteSchema = pathname === '/' ? {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Stellar Blade Guide',
      url: siteUrl,
      description: 'Complete guide for Stellar Blade collectibles, walkthroughs, and secrets',
      publisher: { '@type': 'Organization', name: 'Stellar Blade Guide' }
    } : null;

    const breadcrumbSchema = crumbsKey ? breadcrumbList(JSON.parse(crumbsKey) as Crumb[]) : null;

    const pageSchema = {
      '@context': 'https://schema.org',
      '@type': type,
      url: currentUrl,
      ...(headline && { headline }),
      ...(description && { description }),
      publisher: { '@type': 'Organization', name: 'Stellar Blade Guide' }
    };

    const scripts: HTMLScriptElement[] = [];

    const addSchema = (schema: object) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      scripts.push(script);
    };

    if (websiteSchema) addSchema(websiteSchema);
    if (breadcrumbSchema) addSchema(breadcrumbSchema);
    addSchema(pageSchema);

    if (extraSchemas) {
      extraSchemas.forEach(schema => addSchema(schema));
    }

    return () => {
      scripts.forEach(script => script.remove());
    };
  }, [pathname, headline, description, type, extraSchemas, crumbsKey]);

  return null;
}