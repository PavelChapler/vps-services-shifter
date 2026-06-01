---
description: Аудит скорости лендинга — Core Web Vitals, Lighthouse, вес страницы.
---

Запусти агента `web-perf-auditor`.

Цель: `$ARGUMENTS` (url локального превью/домен/папка `dist/`; если пусто — собери активный лендинг и проверь его).

Проверить:
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- Lighthouse (`npx lighthouse … --headless`), если доступен; иначе — статанализ `dist/`
- картинки (webp/avif, width/height, lazy), JS (лишняя гидрация, синхронные сторонние скрипты), CSS (render-blocking, критический), шрифты (swap/preconnect)

Вывод: метрики CWV с PASS/FAIL по каждой + находки по убыванию влияния + готовые правки. Точечные безопасные правки применяй сам, показывай дифф.
