import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PORT = process.env.PORT || 8787;
export const LAVA_API_KEY = process.env.LAVA_API_KEY || '';
export const LAVA_SHOP_ID = process.env.LAVA_SHOP_ID || '';
export const LAVA_WEBHOOK_SECRET = process.env.LAVA_WEBHOOK_SECRET || '';

export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// slug тарифа → товар Lava.top (источник истины по ценам/товарам для всех доменов).
export const products = JSON.parse(readFileSync(resolve(__dirname, '../products.json'), 'utf8'));
