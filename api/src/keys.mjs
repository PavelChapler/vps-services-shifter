import { takeKey } from './db.mjs';

/**
 * Выдать ключ Xor для оплаченного заказа.
 *
 * Сейчас: берём свободный ключ из пула (таблица keys, наполняется `npm run seed-keys`).
 * TODO(Xor): заменить на реальную выдачу — вызвать API ядра Xor / бот-бэкенда (@VPN_XOR_FAST_bot),
 * который минтит ключ под тариф order.plan, и вернуть его. Пул оставить как резерв/фолбэк.
 */
export function issueKey(order) {
  return takeKey(order.plan, order.id);
}
