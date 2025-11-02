import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Copy sitemap.xml to dist
copyFileSync(
  join(__dirname, 'sitemap.xml'),
  join(__dirname, 'dist', 'sitemap.xml')
);

console.log('✅ Copied sitemap.xml to dist/')