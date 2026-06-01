import crypto from 'node:crypto';
import { LAVA_API_KEY, LAVA_SHOP_ID, LAVA_WEBHOOK_SECRET } from './config.mjs';

/**
 * Создать счёт в Lava.top и получить ссылку на оплату.
 *
 * ⚠️ TODO(Lava): сверить с АКТУАЛЬНОЙ документацией Lava.top — точный endpoint, имена полей,
 * заголовок авторизации и форму ответа. Ниже — ожидаемая структура; подставь реальные значения.
 */
export async function createInvoice({ product, email, orderId, successUrl }) {
  const res = await fetch('https://gate.lava.top/api/v2/invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': LAVA_API_KEY,
    },
    body: JSON.stringify({
      shopId: LAVA_SHOP_ID,
      offerId: product.lavaProductId,
      sum: product.price,
      email,
      orderId, // наш id — вернётся в webhook для сопоставления
      successUrl, // вернуть пользователя на наш /success/?order=<id>
    }),
  });
  if (!res.ok) {
    throw new Error(`Lava invoice error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  // TODO(Lava): уточнить имена полей в ответе.
  return { url: data.paymentUrl || data.url, invoiceId: data.id || data.invoiceId };
}

/**
 * Проверить подпись webhook Lava.top.
 * ⚠️ TODO(Lava): сверить алгоритм с доками (обычно HMAC-SHA256 от сырого тела по секрету магазина).
 */
export function verifyWebhook(rawBody, signature) {
  if (!LAVA_WEBHOOK_SECRET) return true; // в деве без секрета — пропускаем
  const expected = crypto.createHmac('sha256', LAVA_WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature || '', 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}
