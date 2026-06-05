import { takeKey } from './db.mjs';

// Тариф (slug) -> срок подписки в днях.
const PLAN_DAYS = { '1month': 30, '1year': 365, '2years': 730 };

const BOT_API_BASE = (process.env.BOT_API_BASE || '').replace(/\/+$/, '');
const BOT_API_TOKEN = process.env.BOT_API_TOKEN || '';

async function botFetch(path, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${BOT_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
        'X-API-Key': BOT_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(t);
  }
}

/**
 * Выдать ключ Xor для оплаченного заказа.
 *
 * Боевой путь — web-API бота (@VPN_XOR_FAST_bot):
 *   1) POST /users                    -> создаём пользователя (без telegram_id, веб-покупатель)
 *   2) POST /users/{id}/subscription  -> платная подписка + провижин в Remnawave
 * Возвращаем subscription_url (ссылка-подписка = ключ доступа).
 *
 * Если BOT_API не настроен или вызов упал — фолбэк на пул ключей (takeKey),
 * чтобы оплата не зависала без выдачи.
 */
export async function issueKey(order) {
  if (!BOT_API_BASE || !BOT_API_TOKEN) {
    return takeKey(order.plan, order.id); // пул / демо-резерв
  }

  const days = PLAN_DAYS[order.plan];
  if (!days) {
    console.error('[issueKey] неизвестный тариф, фолбэк на пул:', order.plan);
    return takeKey(order.plan, order.id);
  }

  try {
    // 1) Пользователь (веб-покупатель, без telegram_id).
    const user = await botFetch('/users', {});
    if (!user.id) throw new Error('нет id пользователя в ответе бота');

    // 2) Платная подписка -> провижин в Remnawave -> subscription_url.
    const resp = await botFetch(`/users/${user.id}/subscription`, {
      duration_days: days,
      is_trial: false,
    });

    const url = resp?.subscription?.subscription_url;
    if (!url) throw new Error('нет subscription_url в ответе бота');
    return url;
  } catch (e) {
    console.error('[issueKey] вызов бота упал, фолбэк на пул:', e.message);
    return takeKey(order.plan, order.id);
  }
}
