# GoNext — дневник туриста

Мобильное офлайн-приложение для планирования путешествий: идеи «куда хочу» → места → поездка → «куда дальше» → дневник.

## Стек

- React Native + **Expo SDK 54**
- Expo Router
- React Native Paper
- SQLite (локально на устройстве)
- TypeScript
- Android и iOS; сервер и аккаунт в MVP **не** нужны

## Прототип — эталон (сценарий Б)

| Роль | Путь |
|------|------|
| **Оригинал** (не редактировать) | `F:\Projects\Cursor\Work\9-GoNext\gonext_prototype.html` |
| **Рабочая копия** | `F:\Projects\Cursor\Work\9-GoNext\docs\reference\gonext_prototype.html` |

Копия создаётся на Этапе 0. Визуал и структура экранов = прототип; отклонения только после явного согласования (список в `STATUS.md`).

Концепция и модель данных: `PROJECT_GoNext.md`.

## Установка с нуля

```powershell
cd F:\Projects\Cursor\Work\9-GoNext
npm install
```

Нужны: Node.js LTS, npm, Expo Go на телефоне (или эмулятор).

## Запуск dev

```powershell
cd F:\Projects\Cursor\Work\9-GoNext
npm start
```

Дальше: QR в Expo Go, либо `a` / `w` в терминале Expo.

## Структура папок (целевая)

```text
app/                 # экраны Expo Router
components/          # общие UI-компоненты
features/            # places, tripIdeas, trips, nextPlace
database/            # инициализация SQLite
repositories/        # доступ к таблицам
services/            # бизнес-логика
hooks/
types/
constants/           # version.js — единственный __version__
utils/               # в т.ч. раскладка ЙЦУКЕН↔QWERTY для поиска
assets/
docs/                # PLAN/TIME/BACKLOG/devlog + копия прототипа
gonext_prototype.html # оригинал прототипа (не трогать)
PROJECT_GoNext.md    # спецификация продукта
```

## Переменные окружения

Имена (значения только в `.env`, файл в `.gitignore`):

| Имя | Назначение |
|-----|------------|
| `EXPO_PUBLIC_APP_NAME` | отображаемое имя приложения (опционально) |

Секретов сервера в MVP нет; при появлении ключей — только через `process.env.*`, без вывода в логи.

## Версия приложения

Единственный источник: `constants/version.js`, переменная `__version__`.

- UI: `formatAppVersion()` → вид `0.1.0: 2026-08-12 21:58` (версия: дата время)
- логи: тот же `formatAppVersion()` / `__version__`
- сборка Expo: `app.config.js` читает `version: __version__`
- имя установщика / артефакта: `getInstallerBaseName()` → `GoNext-0.1.0`

**Не хардкодить** номер версии в других файлах. При бампе менять только `__version__` в `constants/version.js`. Поле `package.json` → `version` не используется как версия приложения (оставьте `0.0.0`).

## Завершение этапа: завершаем этап

По закрытии **каждого** этапа из `PLAN.md`:

1. Обновить `PLAN.md` / `STATUS.md` / `docs/TIME.md` + девлог.
2. Бамп `__version__` в `constants/version.js` при необходимости (веха = версия в сообщении коммита).
3. **Коммит и пуш** на `origin` в формате вехи:

```text
feat: этап N — краткая суть (vX.Y.Z)

2–5 строк: что вошло в этап, ключевые решения.
Обновлены PLAN, STATUS, TIME (и другие доки по факту).
```

Пример структуры:

```text
feat: этап 0 — окружение, копия прототипа, правила вех (v0.1.0)

Проверен Expo 54, копия gonext_prototype в docs/reference,
единый constants/version.js, ритуал коммит+пуш по этапам.
Обновлены PLAN, README, STATUS, TIME.
```

## Поиск и ошибочная раскладка

Во всех пользовательских поисках (Места, Хочу и т.д.) — двунаправленный маппинг **ЙЦУКЕН ↔ QWERTY**: запрос `,jkb` находит «боли», `ghjn` находит «прот». Реализация — общий util (план: подшаги 3.1 / 4.1), не копипаста по экранам.

## Документация проекта

| Файл | Роль |
|------|------|
| `PLAN.md` | этапы, чек-листы, сметы часов |
| `STATUS.md` | решения, прогресс, открытые вопросы |
| `docs/TIME.md` | единственный учёт накопленного времени |
| `docs/BACKLOG.md` | бэклог с целевым подшагом |
| `docs/devlog/` | девлоги закрытых шагов |
