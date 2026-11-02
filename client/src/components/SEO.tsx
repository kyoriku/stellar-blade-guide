import { useInRouterContext, useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

export default function SEO(props: SEOProps) {
  // The root error boundary's page renders outside the router (see ErrorPage), where
  // useLocation throws. Nothing navigates there, so the address bar is that page's.
  return useInRouterContext()
    ? <RoutedHead {...props} />
    : <Head {...props} path={window.location.pathname} />;
}

// The router's location, not window.location: a link moves the address bar at once,
// while the page on screen can still render until the next one is ready.
function RoutedHead(props: SEOProps) {
  const { pathname } = useLocation();
  return <Head {...props} path={pathname} />;
}

function Head({
  title,
  description,
  canonical,
  ogImage = 'https://img.stellarbladeguide.com/stellar-blade/site/og-banner.webp',
  ogType = 'website',
  noindex = false,
  path
}: SEOProps & { path: string }) {
  const siteName = 'Stellar Blade Guide';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const siteUrl = 'https://stellarbladeguide.com';
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : `${siteUrl}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}