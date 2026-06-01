import { copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];

if (!name) {
  console.error('Использование: npm run new <site-name>');
  process.exit(1);
}

const src = resolve(__dirname, '../sites/example.json');
const dest = resolve(__dirname, '../sites', `${name}.json`);

if (existsSync(dest)) {
  console.error(`sites/${name}.json уже существует`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`✓ Создан sites/${name}.json`);
console.log('  Отредактируй: domain, brand, telegram.bot, оффер, тарифы, legal.*');
console.log(`  Запуск: SITE=${name} npm run dev`);
console.log(`  Сборка: SITE=${name} npm run build`);
