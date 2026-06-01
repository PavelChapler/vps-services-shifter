import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Загружает конфиг активного домена: sites/<SITE>.json (по умолчанию example). */
export function loadSite() {
  const name = process.env.SITE || 'example';
  const path = resolve(__dirname, '../../sites', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Ссылка на Telegram-бот с параметром атрибуции (?start=).
 * Оплата/тарифы/выдача конфига — в боте; лендинг только ведёт сюда.
 */
export function botLink(site, start) {
  const u = new URL(site.telegram.bot);
  const s = start ?? site.telegram.startParam;
  if (s) u.searchParams.set('start', s);
  return u.href;
}

/** Ссылка на on-site оформление выбранного тарифа. Метки атрибуции добавляет клиентский скрипт в Base. */
export function buyLink(site, slug) {
  return `/buy/${slug}/`;
}
