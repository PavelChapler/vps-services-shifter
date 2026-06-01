# Phantom Lendings API

Тонкий общий сервис над **[Platega](https://docs.platega.io)** (PSP) — один на все домены-лендинги. Держит креды Platega server-side, создаёт транзакцию, по webhook'у выдаёт ключ Xor. Лендинги (статика) ходят сюда через `fetch`.

Platega — платёжный шлюз без авто-выдачи товара: ключ выдаёт **наш бэкенд** (`issueKey()`), не провайдер.

**Стек:** Node + Express + встроенный `node:sqlite` (без нативной сборки).

## Контракт (его ждёт фронт лендинга)
| Метод | Назначение | Тело / параметры | Ответ |
|------|-----------|------------------|-------|
| `POST /pay` | Создать транзакцию | `{ plan, email, method, attr }` | `{ url, order }` — ссылка на оплату Platega |
| `GET /key?order=<id>` | Забрать ключ после оплаты | — | `{ key }` или `{}` (ещё не выдан) |
| `POST /webhook/platega` | Webhook Platega: оплата → выдача ключа | тело Platega + `X-MerchantId`/`X-Secret` | `200` |
| `GET /health` | Проверка | — | `{ ok, demo }` |

`returnUrl` для Platega строится на домене запроса (заголовок `Origin`) → пользователь возвращается на свой лендинг `/success/?order=<id>`.

## Platega — что используется (из доки/SDK)
- База `https://app.platega.io`, заголовки `X-MerchantId` + `X-Secret`, JSON/HTTPS.
- Создание: `POST /transaction/process` `{ id(uuid), paymentMethod, paymentDetails{amount,currency}, description, returnUrl, failedUrl, payload }` → `{ redirect, id }`.
- `paymentMethod`: `2`=СБП QR, `10`=CardsRub, `11`=CardAcquiring, `12`=International, `13`=Crypto (маппинг card/sbp/crypto — в `src/platega.mjs → METHODS`).
- Webhook `{ id, status(CONFIRMED/CANCELED), amount, payload }`; верификация — совпадение `X-MerchantId`/`X-Secret`; ответ `200`, иначе ретраи ×3.

## Запуск
```bash
npm install
cp .env.example .env        # заполни PLATEGA_MERCHANT_ID / PLATEGA_SECRET
npm run seed-keys           # наполнить пул ключей (демо) — или: npm run seed-keys KEY1 KEY2 ...
npm start                   # http://localhost:8787
```
Вебхук в кабинете Platega укажи на `https://<api-домен>/webhook/platega`.

## Демо без Platega
Если `PLATEGA_MERCHANT_ID` пуст — демо-режим: `POST /pay` сразу помечает заказ оплаченным и выдаёт ключ из пула. Прогон контракта:
```bash
npm run seed-keys
npm run smoke               # /health, /pay, /key
```

## Что доделать перед боем (TODO в коде)
1. **`src/platega.mjs`** — сверить с актуальной докой Platega: точный путь endpoint (`/transaction/process`?), регистр имён JSON-полей, формат webhook и значение статуса (`CONFIRMED`).
2. **`src/platega.mjs → METHODS`** — подтвердить, какие `paymentMethod` включены у твоего мерчанта (card → 10/11?).
3. **`src/keys.mjs → issueKey()`** — заменить пул на реальную выдачу: вызов API ядра Xor / бот-бэкенда (`@VPN_XOR_FAST_bot`). Пул оставить резервом.
4. **`products.json`** — выставить реальные цены тарифов.
5. Дублирование ключа на **e-mail** после оплаты.
6. **`ALLOWED_ORIGINS`** — ограничить список доменов (или оставить пусто = любой Origin).

## Связка с лендингом
В `../sites/<domain>.json` укажи `checkout.apiBase` = URL этого сервиса. Лендинг шлёт `plan` (slug) + `method`; цены/тарифы — здесь, в `products.json`.

## Деплой
Любой Node-хост рядом с бэкендом Xor (тот же VPS, что и бот — удобно для выдачи ключей). `data.db` — на постоянный диск; HTTPS — через реверс-прокси (nginx/caddy).
