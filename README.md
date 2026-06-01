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
- `checkout.apiBase` — URL общего API-обёртки над Lava.top (см. ниже).
- `api/products.json` — id товаров Lava.top для каждого тарифа (slug → productId).
- `legal.*` — реальные реквизиты продавца (ИП/ООО/самозанятый).
- `analytics.*` — id Яндекс.Метрики / GA4.
- `src/pages/legal/*` — **шаблоны**, финальную редакцию оферты/политики согласует юрист.

## Платёжный бэкенд (Lava.top)
Оплата и выдача ключа — на сайте, но через **тонкий общий API** (один на все домены; держит секрет Lava server-side; CORS открыт на домены-лендинги). Лендинг — статика, дёргает API через `fetch`.

Контракт, который должен реализовать этот API:
- `POST {apiBase}/pay` — тело `{ plan, email, method, attr }`. Создаёт счёт в Lava.top на товар `checkout.products[plan]`, ставит `success_url = https://<домен>/success/?order=<id>`, отдаёт `{ "url": "<checkout Lava>" }`.
- `GET {apiBase}/key?order=<id>` — отдаёт `{ "key": "<ключ Xor>" }` после подтверждённой оплаты (Lava webhook). До подтверждения — пустой ответ (фронт поллит).

Готовый сервис — в [`api/`](./api/) (`cd api && npm install && npm run smoke` — демо без кредов; настройка и контракт — в `api/README.md`). Настройка: завести товары в Lava.top → их id в `api/products.json` → указать URL сервиса в `checkout.apiBase` конфига домена. Без `apiBase` `/buy` и `/success` работают в демо-режиме (заглушка ключа).

## Перед публикацией прогнать
`/legal-check` (юр-гейт по №281-ФЗ) · `/seo-audit` · `/perf-check`.
