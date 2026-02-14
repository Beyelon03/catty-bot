# Деплой на Railway

## Почему была ошибка «GuildRoomConfig does not exist»

Таблица не создаётся сама. При старте приложения нужно применить миграции Prisma к базе Railway: `prisma migrate deploy`. Если в Railway в качестве команды запуска указан `npm start` (Nest без миграций), таблицы в базе не появятся.

## Что настроено в репозитории

- **Build:** `prisma generate && nest build` — генерируется Prisma Client и собирается проект.
- **Start (prod):** `prisma migrate deploy && node dist/main` — применяются миграции к `DATABASE_URL`, затем запускается приложение.
- **PORT:** приложение слушает `process.env.PORT ?? 3000` (Railway подставляет `PORT` сам).
- **prisma** в **dependencies** — чтобы на Railway при `npm install` (в т.ч. production) был доступен CLI и выполнялся `prisma migrate deploy`.

## Команда запуска

В **`railway.toml`** задано: `npm run build && prisma migrate deploy && node dist/main.js`. Сборка выполняется при старте контейнера, поэтому `dist/` создаётся в том же окружении, где запускается приложение (на Railway артефакты фазы build не всегда попадают в run, поэтому сборка перенесена в start).

## Настройка в Railway

1. **Сервис:** New Project → Deploy from GitHub (репозиторий cat_bot).

2. **PostgreSQL:** добавь плагин PostgreSQL к проекту. Railway создаст переменную `DATABASE_URL` и привяжет её к сервису.

3. **Переменные окружения** (Variables):
   - `DATABASE_URL` — подставляется автоматически, если добавлен PostgreSQL.
   - `DISCORD_TOKEN` — токен бота из Discord Developer Portal.
   - `DISCORD_DEV_GUILD_ID` — ID гильдий через запятую (для слэш-команд в dev) или оставь пустым для глобальной регистрации.

4. **Build Command:**  
   `npm run build`  
   (по умолчанию Railway может использовать его; если указан свой — оставь ровно это).

5. **Start Command:** задаётся в `railway.toml` (сборка при старте + миграции + запуск). В дашборде можно не указывать — конфиг из репозитория имеет приоритет.

6. **Root Directory:** не меняй, если репозиторий — один проект в корне.

После деплоя при первом старте выполнится `prisma migrate deploy`, создадутся все таблицы, затем запустится бот.

---

## Если таблицы всё ещё не создаются

1. **Start Command** в Railway берётся из `railway.toml` (сборка + миграции + node). Не переопределяй его на `npm start` или только `node dist/main`.
2. В логах при старте должна быть строка от Prisma вроде «X migrations applied» или «Already up to date». Если её нет — миграции не запускались.
3. Один раз можно применить миграции вручную: в Railway открой сервис → Shell (или через Railway CLI) и выполни:
   ```bash
   npx prisma migrate deploy
   ```
   Убедись, что в этом окружении задана переменная `DATABASE_URL` от твоего PostgreSQL.
