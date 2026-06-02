import express from 'express';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PORT, products, ALLOWED_ORIGINS, PLATEGA_MERCHANT_ID, PUBLIC_BASE_URL } from './config.mjs';
import { createOrder, getOrder, markPaidWithKey } from './db.mjs';
import { createTransaction, verifyWebhook } from './platega.mjs';
import { issueKey } from './keys.mjs';

const app = express();

// --- CORS (лендинги-однодневки на разных доменах) ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = ALLOWED_ORIGINS.length === 0 || (origin && ALLOWED_ORIGINS.includes(origin));
  if (origin && allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Webhook — сырое тело; остальное — JSON.
app.use('/webhook/platega', express.raw({ type: '*/*' }));
app.use((req, res, next) => (req.path === '/webhook/platega' ? next() : express.json()(req, res, next)));

// --- POST /pay → создать транзакцию Platega, вернуть ссылку на оплату ---
app.post('/pay', async (req, res) => {
  try {
    const { plan, email, method } = req.body || {};
    const product = products[plan];
    if (!product) return res.status(400).json({ error: 'unknown plan' });

    const orderId = crypto.randomUUID();
    // База URL для returnUrl/failedUrl: тело запроса (фронт шлёт location.origin) → заголовок Origin → env-фолбэк.
    const origin = (req.body && req.body.origin) || req.headers.origin || PUBLIC_BASE_URL || '';
    const returnUrl = `${origin}/success/?order=${orderId}`;
    const failedUrl = `${origin}/buy/${plan}/?failed=1`;

    // Демо-режим без кредов Platega: считаем оплаченным сразу и выдаём ключ из пула.
    if (!PLATEGA_MERCHANT_ID) {
      createOrder({ id: orderId, plan, email, origin });
      const key = issueKey({ id: orderId, plan });
      if (key) markPaidWithKey(orderId, key);
      return res.json({ url: returnUrl || `/success/?order=${orderId}`, order: orderId, demo: true });
    }

    // Platega требует абсолютные http(s) URL. Лучше понятная ошибка, чем 400 VAL_0001 от провайдера.
    if (!/^https?:\/\//i.test(origin)) {
      return res.status(400).json({ error: 'origin required: задайте заголовок Origin или PUBLIC_BASE_URL' });
    }

    const { url, transactionId } = await createTransaction({ orderId, method, product, returnUrl, failedUrl });
    createOrder({ id: orderId, plan, email, providerTxnId: transactionId, origin });
    res.json({ url, order: orderId });
  } catch (e) {
    console.error('[pay]', e.message);
    res.status(500).json({ error: 'pay failed' });
  }
});

// --- GET /key?order= → отдать ключ после оплаты (фронт /success поллит) ---
app.get('/key', (req, res) => {
  const order = getOrder(req.query.order);
  if (!order) return res.status(404).json({ error: 'not found' });
  if (order.status !== 'paid' || !order.key) return res.json({}); // ещё не оплачено / не выдан
  res.json({ key: order.key });
});

// --- POST /webhook/platega → подтверждение оплаты, выдача ключа ---
app.post('/webhook/platega', (req, res) => {
  if (!verifyWebhook(req.headers)) return res.sendStatus(401);

  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  let p = {};
  try { p = JSON.parse(raw); } catch { return res.sendStatus(400); }

  const confirmed = String(p.status || '').toUpperCase() === 'CONFIRMED';
  const orderId = p.payload || p.id; // мы кладём orderId и в id, и в payload
  if (!confirmed || !orderId) return res.sendStatus(200);

  const order = getOrder(orderId);
  if (order && order.status !== 'paid') {
    const key = issueKey(order);
    if (key) markPaidWithKey(order.id, key);
    // TODO: продублировать ключ на email (как обещано на /success).
  }
  res.sendStatus(200);
});

app.get('/health', (_req, res) => res.json({ ok: true, demo: !PLATEGA_MERCHANT_ID }));

export function startServer() {
  return app.listen(PORT, () => console.log(`API на http://localhost:${PORT}  (demo=${!PLATEGA_MERCHANT_ID})`));
}

// Авто-старт только при прямом запуске (node src/index.mjs), не при импорте из тестов.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}

export { app };
