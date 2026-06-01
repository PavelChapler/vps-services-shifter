---
description: SEO-аудит лендинга под Яндекс+Google — on-page, schema.org, ключи, sitemap/robots.
---

Запусти агента `seo-optimizer`.

Цель: `$ARGUMENTS` (домен/страница/папка; если пусто — активный лендинг и его `dist/`).

Проверить и (где безопасно) починить:
- `<title>` ≤60 и `meta description` ≤155 с целевым ключом; уникальность на домен
- один `<h1>`, корректная иерархия `h2/h3`, семантический HTML
- schema.org JSON-LD: Organization, Service/Product+offers, FAQPage, BreadcrumbList
- Open Graph + Twitter Card, canonical, `lang="ru"`
- ключи: вхождения без переспама, законные формулировки (сверка с разрешённым у `legal-compliance-rf`)
- `robots.txt` + `sitemap.xml`, отсутствие случайного `noindex` на бою
- влияние Core Web Vitals — при необходимости делегируй `web-perf-auditor`

Вывод: находки с приоритетом (CRITICAL/HIGH/MEDIUM), `файл:строка`, правка. Применённые правки — диффом.
