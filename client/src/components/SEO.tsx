interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

export default function SEO({
  title,
  description,
  canonical,
  ogImage = 'https://res.cloudinary.com/drw9mrozr/image/upload/w_1920/f_webp,q_auto/v1764288880/stellar-blade/homepage/banner.jpg',
  ogType = 'website',
  noindex = false
}: SEOProps) {
  const siteName = 'Stellar Blade Guide';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const siteUrl = 'https://stellarbladeguide.com';
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : `${siteUrl}${window.location.pathname}`;

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