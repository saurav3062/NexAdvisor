import { Helmet } from 'react-helmet-async';
import React from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Connect with expert consultants worldwide for professional advice and guidance.',
  keywords = ['consultants', 'experts', 'professional advice', 'online consultation'],
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
}) => {
  const siteTitle = 'NexAdvisor';
  const fullTitle = `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO tags */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#2563eb" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    </Helmet>
  );
};

export const generateMetaTags = (data: SEOProps) => {
  return {
    title: `${data.title} | NexAdvisor`,
    meta: [
      {
        name: 'description',
        content: data.description,
      },
      {
        name: 'keywords',
        content: data.keywords?.join(', '),
      },
      {
        property: 'og:title',
        content: data.title,
      },
      {
        property: 'og:description',
        content: data.description,
      },
      {
        property: 'og:image',
        content: data.image,
      },
      {
        property: 'og:url',
        content: data.url,
      },
      {
        property: 'og:type',
        content: data.type,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: data.title,
      },
      {
        name: 'twitter:description',
        content: data.description,
      },
      {
        name: 'twitter:image',
        content: data.image,
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: data.url,
      },
    ],
  };
};