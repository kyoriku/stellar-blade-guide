import { useEffect } from 'react';

interface StructuredDataProps {
  type?: 'WebPage' | 'Article' | 'CollectionPage';
  headline?: string;
  description?: string;
  extraSchemas?: object[];
}

export default function StructuredData({
  type = 'WebPage',
  headline,
  description,
  extraSchemas
}: StructuredDataProps) {
  const siteUrl = 'https://stellarbladeguide.com';
  const pathname = window.location.pathname;
  const currentUrl = `${siteUrl}${pathname}`;

  const websiteSchema = pathname === '/' ? {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Stellar Blade Guide',
    url: siteUrl,
    description: 'Complete guide for Stellar Blade collectibles, walkthroughs, and secrets',
    publisher: { '@type': 'Organization', name: 'Stellar Blade Guide' }
  } : null;

  const generateBreadcrumbs = () => {
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return null;

    const breadcrumbs = [{ name: 'Home', url: '/' }];
    let currentPath = '';

    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      let name = part.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (index === 0) {
        const sectionNames: Record<string, string> = {
          collectibles: 'Collectibles',
          levels: 'Levels',
          walkthroughs: 'Walkthroughs'
        };
        name = sectionNames[part] || name;
      }

      breadcrumbs.push({ name, url: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const breadcrumbSchema = breadcrumbs ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.url}`
    }))
  } : null;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': type,
    url: currentUrl,
    ...(headline && { headline }),
    ...(description && { description }),
    publisher: { '@type': 'Organization', name: 'Stellar Blade Guide' }
  };

  useEffect(() => {
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
  }, [pathname, headline, description, type, extraSchemas]);

  return null;
}