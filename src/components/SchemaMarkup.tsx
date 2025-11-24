import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SchemaMarkupProps {
  type: 'product' | 'service' | 'organization' | 'website';
  data: {
    name: string;
    description: string;
    price?: string;
    currency?: string;
    availability?: string;
    rating?: number;
    reviewCount?: number;
    image?: string;
    url?: string;
  };
}

const SchemaMarkup: React.FC<SchemaMarkupProps> = ({ type, data }) => {
  const generateSchema = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": type === 'product' ? 'Product' : type === 'service' ? 'Service' : type === 'organization' ? 'Organization' : 'WebSite',
      "name": data.name,
      "description": data.description,
    };

    if (type === 'product' || type === 'service') {
      return {
        ...baseSchema,
        "brand": {
          "@type": "Brand",
          "name": "BaimonShop"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": data.currency || "THB",
          "price": data.price || "0",
          "availability": data.availability || "https://schema.org/InStock",
          "validFrom": new Date().toISOString().split('T')[0],
          "seller": {
            "@type": "Organization",
            "name": "BaimonShop",
            "url": "https://www.coin-zone.shop"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": data.rating || 4.8,
          "reviewCount": data.reviewCount || 1000,
          "bestRating": 5,
          "worstRating": 1
        },
        "image": data.image || [
          "https://www.coin-zone.shop/logo.png",
          "https://www.coin-zone.shop/product-default.png"
        ],
        "url": data.url || "https://www.coin-zone.shop",
        "provider": {
          "@type": "Organization",
          "name": "BaimonShop",
          "url": "https://www.coin-zone.shop"
        },
        "category": data.category || "Digital Products"
      };
    }

    if (type === 'organization') {
      return {
        ...baseSchema,
        "url": "https://www.coin-zone.shop",
        "logo": "https://www.coin-zone.shop/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Thai"
        }
      };
    }

    return baseSchema;
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(generateSchema(), null, 2)}
      </script>
    </Helmet>
  );
};

export default SchemaMarkup;