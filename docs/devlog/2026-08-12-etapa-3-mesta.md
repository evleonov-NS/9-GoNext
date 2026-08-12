# 2026-08-12 — Этап 3: Места (CRUD, фильтры, поиск)

## Сделано

- `utils/keyboardLayout.ts` — двунаправленный ЙЦУКЕН↔QWERTY; поиск на вкладке «Места» (`,jkb`→боли, `ghjn`→прот).
- Список: вкладки Все / Хочу посетить / Посещённые / Понравилось + фильтр по категории; «Посещённые» через `trip_places.status = visited`.
- Форма create/edit (`/form/place`, `?id=`): name, city, description, category, coords, visitLater, liked; toast копирования координат.
- Карточка места: обложка категории, карта/навигатор (`geo:` / Apple Maps / web Google), clipboard + toast, toggles, список поездок, edit/delete.
- Удаление места чистит связи в `trip_places` / `trip_idea_places`.
- `expo-clipboard`; hooks `usePlaces` / `usePlace` с refresh по focus.
- Версия `__version__` → `0.4.0`.

## Проверка

- `npx tsc --noEmit` — без ошибок.
- Критерий: CRUD Place офлайн; без координат → карта по названию; с координатами → «Координаты скопированы».

## Время

- План: 6 ч
- Факт: ~1 ч 45 настенных (метка начала не ставилась)
