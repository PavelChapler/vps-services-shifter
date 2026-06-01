import crypto from 'node:crypto';
import { addKey } from '../src/db.mjs';

// Наполнить пул ключей.
//   node scripts/seed-keys.mjs KEY1 KEY2 ...   — добавить конкретные ключи
//   node scripts/seed-keys.mjs                 — добавить 5 демо-ключей
const args = process.argv.slice(2);
const keys = args.length
  ? args
  : Array.from({ length: 5 }, (_, i) => `XOR-DEMO-${i + 1}-${crypto.randomUUID().slice(0, 8)}`);

keys.forEach((k) => addKey(k, null));
console.log(`Добавлено ключей в пул: ${keys.length}`);
