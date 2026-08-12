# 2026-08-12 — Этап 2: SQLite и слой данных

## Сделано

- Подключён `expo-sqlite` (SDK 54), плагин в `app.config.js`.
- `database/`: миграция v1 (`user_version`), таблицы places / trip_ideas / trip_idea_places / trips / trip_places / photos / app_meta.
- `types/models.ts` — camelCase-типы по PROJECT; репозитории мапят snake_case ↔ типы.
- CRUD-репозитории: places, tripIdeas (+ места идеи), trips (+ места поездки), photos. SQL только в `repositories/`.
- Сид §25.1: 7 мест Карелия/Выборг + Алтай/Стамбул; активная Карелия (день 2 из 4 относительно «сегодня»), Выборг (старт сегодня), дневник 2025 (Сампо skipped), идеи Алтай и Стамбул. Крайние случаи: без координат, без дня, skipped.
- `SQLiteProvider` + Suspense в корневом layout; вкладка «Места» и Настройки читают через repository (`hooks/usePlaces`).
- Версия `__version__` → `0.3.0`.

## Проверка

- `npx tsc --noEmit` — без ошибок.
- Критерий этапа: список мест из SQLite на вкладке «Места»; счётчики в Настройках; повторный старт не дублирует сид (`seed_version`).

## Время

- План: 4 ч
- Факт: <= 1 ч 15 настенных (метка начала не ставилась)
