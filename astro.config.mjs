import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadSite } from './src/lib/site.mjs';

// Активный домен выбирается переменной окружения SITE (имя файла в sites/):
//   SITE=example npm run build        → берёт sites/example.json, canonical/sitemap из его поля "domain"
// Один шаблон → N доменов. Никаких хардкодов домена в коде — только в конфиге.
const site = loadSite();

export default defineConfig({
  site: `https://${site.domain}`,
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
