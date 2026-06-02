import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PORT = process.env.PORT || 8787;
export const PLATEGA_MERCHANT_ID = process.env.PLATEGA_MERCHANT_ID || '';
export const PLATEGA_SECRET = process.env.PLATEGA_SECRET || '';
// Фолбэк базового URL для returnUrl/failedUrl, если фронт не прислал origin и нет заголовка Origin
// (например, серверные вызовы). В обычном браузерном потоке origin приходит с фронта.
export const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';

export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// slug тарифа → цена/валюта/название (источник истины по тарифам для всех доменов).
export const products = JSON.parse(readFileSync(resolve(__dirname, '../products.json'), 'utf8'));
