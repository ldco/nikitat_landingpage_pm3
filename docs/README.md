# Puppet Master — PM v3 (SvelteKit)

Миграция с Nuxt 4 (PM v2) на SvelteKit 5 (PM v3) для сайта FABRICA22.

## Статус проекта

**Аудит завершён.** Кодовая инфраструктура написана, но визуально и функционально проект НЕ соответствует PM v2.

| Аспект | Статус |
|--------|--------|
| Схема БД (31 таблица) | ✅ Полный паритет с PM v2 |
| Компоненты (48 шт: 21+6+8+13) | ⚠️ Скелеты с generic-Tailwind |
| Роуты (public + admin + API) | ✅ Все существуют |
| CSS (app.css, 579 строк) | ⚠️ Токены есть, вёрстки нет |
| i18n (Paraglide, 364 ключа) | ✅ UI строки, контент в БД |
| Контент БД (20 таблиц) | ❌ Пусто |
| Admin CRUD (17 страниц) | ❌ Read-only |
| GSAP анимации | ❌ Отсутствуют |
| Scrollytelling / RTL | ❌ Отсутствуют |
| Деплой (Ansible) | ⚠️ 12 NUXT_BUILD_* → BUILD_* |

Финальный план миграции: **7 фаз** → **PLAN.md**

## Документация

- **`PLAN.md`** — канонический план миграции: 7 фаз, конкретные шаги, файлы, верификация
- **`CSS-ARCHITECTURE.md`** — система стилей: что в app.css, что в компонентах, как работают токены
- **`ARCHITECTURE.md`** — полный анализ фреймворка PM v2: 58 секций, CSS→Component map, API, БД, деплой

## Быстрый старт

```bash
npm run dev          # Запустить dev-сервер (порт 5173)
npm run check        # TypeScript проверка
npm run build        # Production сборка
npm run db:seed      # Посев БД (пока только инфраструктура)
npm run db:reset     # Сброс + посев БД
```

## Ключевые решения (архитектурные)

| Решение | Значение |
|---------|----------|
| Фреймворк | SvelteKit 5 + Svelte 5 runes API |
| CSS | Tailwind CSS v4 + PM design tokens в `@theme` |
| Тёмная тема | Class-based (`.dark {}`), НЕ `light-dark()` |
| i18n | Paraglide (UI) + DB translation tables (контент) |
| База данных | SQLite + Drizzle ORM (как в PM v2) |
| Аутентификация | Cookie-based sessions + RBAC |
| Валидация | Zod (как в PM v2) |
| Анимации | GSAP + Matter.js (framework-agnostic) |
| API envelope | `{ success: true, data }` / `throw error()` |
| Состояние | Только `$state()`, `$derived()`, `$page.data` — без глобальных store |
