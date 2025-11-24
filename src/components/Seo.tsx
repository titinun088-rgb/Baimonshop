import React from 'react';
import { Helmet } from 'react-helmet-async';

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  canonical?: string;
  keywords?: string;
};

const SITE_NAME = 'BaimonShop';

const DEFAULT_TITLE = 'รับเติมเกม BaimonShop | เว็บเติมเกม เติมเกมออนไลน์ ราคาถูก รวดเร็ว ปลอดภัย';
const DEFAULT_DESCRIPTION = 'รับเติมเกม BaimonShop เว็บเติมเกมออนไลน์อันดับ 1 เติมเกม ROV Free Fire PUBG Mobile Legends เติมแอปพรีเมียม Netflix Spotify YouTube Premium ราคาถูกที่สุด รวดเร็วทันใจ ปลอดภัย 100% เว็ปเติมเกมที่ดีที่สุด บริการตลอด 24 ชั่วโมง';
const DEFAULT_URL = 'https://www.baimonshop.com/';
const DEFAULT_IMAGE = `${DEFAULT_URL}logo.png`;
const DEFAULT_KEYWORDS = 'รับเติมเกม, เติมเกม, เว็บเติมเกม, เว็ปเติมเกม, baimonshop, BaimonShop, เว็บเติมเกมออนไลน์, เว็ปเติมเกมออนไลน์, รับเติมเกมออนไลน์, เว็บรับเติมเกม, เว็ปรับเติมเกม, ร้านเติมเกม, เติมเกมออนไลน์, เติมเงินเกม, topup game';

export default function Seo({ title, description, image, url, canonical, keywords }: SeoProps) {
  const fullTitle = title ? `${title}` : DEFAULT_TITLE;
  const pageUrl = url || canonical || DEFAULT_URL;
  const imageUrl = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description || DEFAULT_DESCRIPTION} />
      <meta name="keywords" content={keywords || DEFAULT_KEYWORDS} />
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
