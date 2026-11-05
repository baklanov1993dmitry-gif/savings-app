# Исходники «Мои накопления»
- `src/*.js|css|html` — исходники; сборка: `cd dev && npm i xlsx playwright-core --prefix _build && python3 _build/build.py` → `savings.html` и `pwa/index.html` (скопировать в корень репо как index.html).
- `_build/e2e*.js` — тесты Playwright (Chromium /opt/pw-browsers/chromium). xlsx-файлы с данными в репо НЕ кладём.
- `rates.yml` — файл запуска робота; его нужно положить в `.github/workflows/` через веб-интерфейс GitHub (агенту туда пушить нельзя).
