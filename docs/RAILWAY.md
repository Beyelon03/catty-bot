# Деплой на Railway

## Почему была ошибка «GuildRoomConfig does not exist»

Таблица не создаётся сама. При старте приложения нужно применить миграции Prisma к базе Railway: `prisma migrate deploy`. Если в Railway в качестве команды запуска указан `npm start` (Nest без миграций), таблицы в базе не появятся.

## Что настроено в репозитории

- **Build:** `prisma generate && nest build` — генерируется Prisma Client и собирается проект.
- **Start (prod):** `prisma migrate deploy && node dist/main` — применяются миграции к `DATABASE_URL`, затем запускается приложение.
- **PORT:** приложение слушает `process.env.PORT ?? 3000` (Railway подставляет `PORT` сам).

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

5. **Start Command (важно):**  
   `npm run start:prod`  
   Не используй `npm start` — иначе миграции не применятся и таблицы в базе не появятся.

6. **Root Directory:** не меняй, если репозиторий — один проект в корне.

После деплоя при первом старте выполнится `prisma migrate deploy`, создадутся все таблицы, затем запустится бот.
