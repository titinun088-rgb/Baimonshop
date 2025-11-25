import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// กำหนด routes ที่ต้องการให้แสดงใน sitemap
const routes = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily'
  },
  {
    path: '/game-topup',
    priority: 0.9,
    changefreq: 'daily'
  },
  {
    path: '/premium-app',
    priority: 0.9,
    changefreq: 'daily'
  },
  {
    path: '/card-topup',
    priority: 0.8,
    changefreq: 'daily'
  },
  {
    path: '/cash-card',
    priority: 0.8,
    changefreq: 'daily'
  },
  {
    path: '/top-up',
    priority: 0.8,
    changefreq: 'daily'
  },
  // SEO Landing Pages
  {
    path: '/รับเติมเกม.html',
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/รับเติมเกม-seo.html',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/แอปพรีเมียม.html',
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/เติม-valorant.html',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/เติม-rov.html',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/เติม-robux.html',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/coinzone.html',
    priority: 0.7,
    changefreq: 'weekly'
  },
  // Auth pages
  {
    path: '/login',
    priority: 0.6,
    changefreq: 'monthly'
  },
  {
    path: '/register',
    priority: 0.6,
    changefreq: 'monthly'
  }
];

// Generate sitemap XML
const generateSitemap = () => {
  const baseUrl = 'https://www.baimonshop.com';
  const today = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${encodeURI(route.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // เขียนไฟล์ sitemap.xml
  const sitemapPath = join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log('✅ Generated sitemap.xml');
}

generateSitemap();