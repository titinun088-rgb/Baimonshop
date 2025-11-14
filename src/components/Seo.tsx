import React from 'react';
import { Helmet } from 'react-helmet-async';

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  canonical?: string;
};

const SITE_NAME = 'CoinZone';

const DEFAULT_TITLE = 'CoinZone - เติมเกมและแอปพรีเมียม';
const DEFAULT_DESCRIPTION = 'รับเติมเกมและแอปพรีเมียม รวดเร็ว ปลอดภัย ใช้งานง่าย';
const DEFAULT_URL = 'https://www.coin-zone.shop/';
// Use the site logo as the default social preview image (absolute URL preferred for crawlers)
// Use URL-encoded filename to be safe for crawlers
const DEFAULT_IMAGE = `${DEFAULT_URL}Logo%20CoinZone.png`;

export default function Seo({ title, description, image, url, canonical }: SeoProps) {
  const fullTitle = title ? `${title}` : DEFAULT_TITLE;
  const pageUrl = url || canonical || DEFAULT_URL;
  const imageUrl = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description || DEFAULT_DESCRIPTION} />
      <link rel="canonical" href={canonical || pageUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || DEFAULT_DESCRIPTION} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter / X */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description || DEFAULT_DESCRIPTION} />
      <meta property="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
