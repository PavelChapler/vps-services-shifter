# Phantom Lendings

Фабрика рекламных лендингов на Astro: **один шаблон → N доменов через конфиг**. Оплата уходит в Telegram-бот (лендинг платежи не принимает). Подробности и правила — в [`CLAUDE.md`](./CLAUDE.md).

## Установка
```bash
npm install
```

## Разработка
```bash
SITE=example npm run dev        # http://localhost:4321 (домен из sites/example.json)
```

## Новый домен
```bash
npm run new mydomain            # создаст sites/mydomain.json из шаблона
# отредактируй sites/mydomain.json: domain, brand, оффер, тарифы, checkout.apiBase, реквизиты
```
Либо командой Claude: `/new-landing mydomain.com <оффер>`.

## Сборка под домен
```bash
SITE=mydomain npm run build     # → dist/ (canonical, sitemap, robots — из конфига)
SITE=mydomain npm run preview
```
Залить `dist/` на любой статический хостинг/CDN. Каждый домен билдится со своим `SITE`.

## Что заполнить перед боем
- `checkout.apiBase` — URL общего API над Platega (см. ниже).
- `api/products.json` — цены тарифов (slug → amount/currency); креды Platega — в `api/.env`.
- `legal.*` — реальные реквизиты продавца (ИП/ООО/самозанятый).
- `analytics.*` — id Яндекс.Метрики / GA4.
- `src/pages/legal/*` — **шаблоны**, финальную редакцию оферты/политики согласует юрист.

## Платёжный бэкенд (Platega)
Оплата на сайте через [Platega](https://docs.platega.io) (PSP), за ней — **тонкий общий API** (один на все домены; держит креды Platega server-side; CORS на домены-лендинги). Лендинг — статика, дёргает API через `fetch`. Platega не выдаёт товар сам — **ключ выдаёт наш бэкенд** по webhook'у.

Контракт:
- `POST {apiBase}/pay` — тело `{ plan, email, method, attr }`. Создаёт транзакцию Platega (сумма из `api/products.json[plan]`), `returnUrl = https://<домен>/success/?order=<id>`, отдаёт `{ "url": "<страница оплаты Platega>" }`.
- `POST {apiBase}/webhook/platega` — Platega присылает `CONFIRMED` → бэкенд выдаёт ключ (`issueKey`) и сохраняет под order.
- `GET {apiBase}/key?order=<id>` — `{ "key": "<ключ Xor>" }` после оплаты (фронт поллит).

Готовый сервис — в [`api/`](./api/) (`cd api && npm install && npm run smoke` — демо без кредов; контракт и настройка — в `api/README.md`). Настройка: креды Platega → `api/.env`, цены тарифов → `api/products.json`, webhook в кабинете Platega → `https://<api>/webhook/platega`, URL сервиса → `checkout.apiBase`. Без кредов `/buy` и `/success` работают в демо-режиме (заглушка ключа).

## Перед публикацией прогнать
`/legal-check` (юр-гейт по №281-ФЗ) · `/seo-audit` · `/perf-check`.
