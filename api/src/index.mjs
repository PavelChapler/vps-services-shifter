import express from 'express';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PORT, products, ALLOWED_ORIGINS, LAVA_API_KEY } from './config.mjs';
import { createOrder, getOrder, findOrderByInvoice, markPaidWithKey } from './db.mjs';
import { createInvoice, verifyWebhook } from './lava.mjs';
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

// Webhook — сырое тело (для проверки подписи); остальное — JSON.
app.use('/webhook/lava', express.raw({ type: '*/*' }));
app.use((req, res, next) => (req.path === '/webhook/lava' ? next() : express.json()(req, res, next)));

// --- POST /pay → создать счёт, вернуть ссылку на оплату ---
app.post('/pay', async (req, res) => {
  try {
    const { plan, email } = req.body || {};
    const product = products[plan];
    if (!product) return res.status(400).json({ error: 'unknown plan' });

    const orderId = crypto.randomUUID();
    const origin = req.headers.origin || '';
    const successUrl = `${origin}/success/?order=${orderId}`;

    // Демо-режим без кредов Lava: считаем оплаченным сразу и выдаём ключ из пула.
    if (!LAVA_API_KEY) {
      createOrder({ id: orderId, plan, email, origin });
      const key = issueKey({ id: orderId, plan });
      if (key) markPaidWithKey(orderId, key);
      return res.json({ url: successUrl, order: orderId, demo: true });
    }

    const { url, invoiceId } = await createInvoice({ product, email, orderId, successUrl });
    createOrder({ id: orderId, plan, email, lavaInvoiceId: invoiceId, origin });
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

// --- POST /webhook/lava → подтверждение оплаты, выдача ключа ---
app.post('/webhook/lava', (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const sig = req.headers['x-signature'] || req.headers['signature'] || '';
  if (!verifyWebhook(raw, sig)) return res.sendStatus(401);

  let payload = {};
  try { payload = JSON.parse(raw); } catch { return res.sendStatus(400); }

  // TODO(Lava): сверить имена полей статуса/идентификатора счёта с доками.
  const invoiceId = payload.invoiceId || payload.id;
  const paid = ['paid', 'success', 'completed'].includes(payload.status);
  if (!invoiceId || !paid) return res.sendStatus(200);

  const order = findOrderByInvoice(invoiceId);
  if (order && order.status !== 'paid') {
    const key = issueKey(order);
    if (key) markPaidWithKey(order.id, key);
    // TODO: продублировать ключ на email (как обещано на /success).
  }
  res.sendStatus(200);
});

app.get('/health', (_req, res) => res.json({ ok: true, demo: !LAVA_API_KEY }));

export function startServer() {
  return app.listen(PORT, () => console.log(`API на http://localhost:${PORT}  (demo=${!LAVA_API_KEY})`));
}

// Авто-старт только при прямом запуске (node src/index.mjs), не при импорте из тестов.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}

export { app };
