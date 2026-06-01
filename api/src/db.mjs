import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(process.env.DB_PATH || resolve(__dirname, '../data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    plan TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    key TEXT,
    lava_invoice_id TEXT,
    origin TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value TEXT NOT NULL,
    plan TEXT,
    used INTEGER NOT NULL DEFAULT 0,
    order_id TEXT
  );
`);

export function createOrder(o) {
  db.prepare(
    `INSERT INTO orders (id, plan, email, status, lava_invoice_id, origin, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?, ?)`
  ).run(o.id, o.plan, o.email ?? null, o.lavaInvoiceId ?? null, o.origin ?? null, Date.now());
}

export function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

export function findOrderByInvoice(invoiceId) {
  return db.prepare('SELECT * FROM orders WHERE lava_invoice_id = ?').get(invoiceId);
}

export function markPaidWithKey(id, key) {
  db.prepare(`UPDATE orders SET status = 'paid', key = ? WHERE id = ?`).run(key, id);
}

// Пул ключей (демо-источник выдачи).
export function addKey(value, plan) {
  db.prepare('INSERT INTO keys (value, plan) VALUES (?, ?)').run(value, plan ?? null);
}

export function takeKey(plan, orderId) {
  const row = db
    .prepare(`SELECT * FROM keys WHERE used = 0 AND (plan IS NULL OR plan = ?) ORDER BY id LIMIT 1`)
    .get(plan);
  if (!row) return null;
  db.prepare('UPDATE keys SET used = 1, order_id = ? WHERE id = ?').run(orderId, row.id);
  return row.value;
}

export default db;
