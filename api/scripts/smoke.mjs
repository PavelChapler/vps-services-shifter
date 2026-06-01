// Прогон контракта без Lava (демо-режим): стартует сервер, бьёт /health, /pay, /key, аккуратно гасит.
import { setTimeout as sleep } from 'node:timers/promises';
import { startServer } from '../src/index.mjs';
import db from '../src/db.mjs';

const server = startServer();
const B = 'http://localhost:' + (process.env.PORT || 8787);
await sleep(400);

try {
  const out = {};
  out.health = await (await fetch(`${B}/health`)).json();
  out.pay = await (
    await fetch(`${B}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: '1month', email: 'test@example.com' }),
    })
  ).json();
  out.key = await (await fetch(`${B}/key?order=${out.pay.order}`)).json();
  console.log(JSON.stringify(out, null, 2));
} finally {
  server.close();
  db.close();
}
