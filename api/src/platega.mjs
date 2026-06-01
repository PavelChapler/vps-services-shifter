import crypto from 'node:crypto';
import { PLATEGA_MERCHANT_ID, PLATEGA_SECRET } from './config.mjs';

const BASE = 'https://app.platega.io';

// PaymentMethod из SDK Platega. ⚠️ Уточни, какие включены у твоего мерчанта.
export const METHODS = {
  card: 11, // CardAcquiring (10 = CardsRub, 12 = InternationalAcquiring)
  sbp: 2, // SbpQr
  crypto: 13, // Cryptocurrency
};

/**
 * Создать транзакцию в Platega → ссылка на оплату (redirect).
 * Известно из доки/SDK: база https://app.platega.io, заголовки X-MerchantId/X-Secret,
 * поля id, paymentMethod, paymentDetails{amount,currency}, description, returnUrl, failedUrl, payload.
 * ⚠️ TODO(Platega): сверить ТОЧНЫЙ путь endpoint и регистр имён полей с docs.platega.io.
 */
export async function createTransaction({ orderId, method, product, returnUrl, failedUrl }) {
  const res = await fetch(`${BASE}/transaction/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MerchantId': PLATEGA_MERCHANT_ID,
      'X-Secret': PLATEGA_SECRET,
    },
    body: JSON.stringify({
      id: orderId, // наш uuid транзакции — вернётся в webhook
      paymentMethod: METHODS[method] ?? METHODS.card,
      paymentDetails: { amount: product.amount, currency: product.currency || 'RUB' },
      description: product.title,
      returnUrl, // вернуть пользователя на /success/?order=<id>
      failedUrl,
      payload: orderId,
    }),
  });
  if (!res.ok) throw new Error(`Platega error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { url: data.redirect, transactionId: data.id || data.transactionId || orderId };
}

function safeEq(a, b) {
  const x = Buffer.from(String(a ?? ''), 'utf8');
  const y = Buffer.from(String(b ?? ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Верификация webhook Platega: совпадение учёток в заголовках X-MerchantId / X-Secret.
 * (Platega не подписывает HMAC — присылает те же креды в заголовках.)
 */
export function verifyWebhook(headers) {
  if (!PLATEGA_MERCHANT_ID) return true; // dev без кредов
  return safeEq(headers['x-merchantid'], PLATEGA_MERCHANT_ID) && safeEq(headers['x-secret'], PLATEGA_SECRET);
}
