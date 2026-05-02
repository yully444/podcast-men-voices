# Мужские голоса — сайт подкаста

Статический сайт на Astro. Контент — Markdown-файлы с фронтматтером.

## Запуск локально

```bash
npm install
npm run dev
```

Открыть <http://localhost:4321>

Сборка для деплоя:

```bash
npm run build
```

Результат — в папке `dist/`. Можно деплоить на Cloudflare Pages, GitHub Pages, Vercel, Netlify.

## Как добавить новый выпуск

1. Создать файл `src/content/episodes/<slug>.md`. Slug — латиницей через дефис, например `put-k-svoey-sile`. Он попадёт в URL: `/episodes/put-k-svoey-sile/`.
2. Заполнить фронтматтер:

   ```yaml
   ---
   title: "Название выпуска"
   date: 2026-04-22
   season: 2
   number: 5
   description: "Короткое описание для списка выпусков."
   audioUrl: "https://....mp3"        # прямой mp3 — нативный плеер
   embedUrl: "https://mave.digital/embed/..."  # альтернатива: iframe-плеер
   duration: "58:00"
   ---
   ```

   Можно указать только что-то одно из `audioUrl` / `embedUrl`. Если оба пусты — покажется заглушка.

3. Под фронтматтером — Markdown с описанием, шоунотами, ссылками. Это будет основным телом страницы выпуска.

## Как добавить транскрипт

1. Получить файл `.vtt` (через Whisper, rev.com, descript). Формат:

   ```text
   WEBVTT

   00:00:00.000 --> 00:00:04.500
   Здравствуйте, это Мужские голоса.

   00:00:04.500 --> 00:00:09.200
   Сегодня мы говорим о деньгах.
   ```

2. Положить файл `src/content/episodes/<slug>.vtt` — slug должен совпадать со slug-ом `.md`.
3. Транскрипт появится автоматически. Клик по тайм-метке перематывает плеер.

## Структура

```text
src/
├── content/episodes/      # выпуски: .md + опциональный .vtt
├── content.config.ts      # схема контента
├── layouts/Layout.astro   # общий шаблон страницы
├── components/            # плеер, транскрипт
├── lib/vtt.ts             # парсер WebVTT
└── pages/
    ├── index.astro            # список выпусков
    └── episodes/[id].astro    # страница выпуска
```
