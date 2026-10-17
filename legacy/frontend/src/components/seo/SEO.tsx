import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

export function SEO({
  title = 'NexAdvisor - Connect with Expert Consultants',
  description = 'Find and book consultations with verified experts across medical, finance, legal, tech, and more. Get personalized advice from industry professionals.',
  keywords = ['experts', 'consultations', 'advice', 'professional', 'consultants', 'booking'],
  image = '/og-image.png',
  url,
  type = 'website'
}: SEOProps) {
  const siteUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const fullTitle = title.includes('NexAdvisor') ? title : `${title} | NexAdvisor`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="NexAdvisor" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={siteUrl} />
    </>
  );
}
