# AI_RULES.md — правила для ИИ

Жёсткие ограничения при генерации и рефакторинге кода.

---

## Границы фич

| Действие | Разрешено | Запрещено |
|----------|-----------|-----------|
| Импорт | Внутри фичи, shared | feature → feature |
| Prisma | Только `infrastructure/` | domain, application, discord |
| Discord-логика | Только вызов use-case | Бизнес-логика в command/handler |
| Связь фич | Events, Application API | Прямой импорт сервиса другой фичи |

---

## Слои

1. **discord/** — только приём команд/событий → вызов use-case.
2. **application/** — один use-case = одна операция; оркестрация, без Prisma/discord.
3. **domain/** — сущности, интерфейсы репозиториев, чистые сервисы; без NestJS, Prisma, discord.
4. **infrastructure/** — реализация репозиториев, адаптеры (Prisma, внешние API).

---

## Паттерны

* Репозиторий: **интерфейс в domain**, реализация в **infrastructure**.
* ИИ: использовать **интерфейс** из domain, реализацию из shared/ai или feature/ai.
* Новая фича: создать все четыре слоя; в AppModule импортировать только модуль фичи.

---

## Запреты

* Не импортировать `PrismaClient` вне `*/infrastructure/`.
* Не создавать «бог-модули» в shared.
* Не писать if/else бизнес-логику в Discord command/handler.
* Не связывать фичи через прямой вызов сервиса (только Events или Application API).

---

## Агенты Discord

Под «агентом» здесь: команда (slash/message), обработчик события или автономный сценарий (в т.ч. с ИИ), который общается с пользователем через Discord.

### Привязка к фичам

| Что | Где живёт | Правило |
|-----|-----------|---------|
| Команда / handler | `features/<feature>/discord/` | Один handler → один use-case этой фичи |
| Регистрация команд | shared/discord | Фича только объявляет команды, клиент — общий |
| Состояние агента (сессия, контекст) | application/ или domain/ | Не хранить в discord-слое |
| Вызов ИИ | application (use-case) | Discord только передаёт input, use-case дергает интерфейс ИИ |

### Цепочка вызова

```
Interaction/Message → discord/*.command.ts → application/*.use-case.ts → domain (+ infrastructure)
```

Handler в `discord/`: парсинг аргументов, валидация ввода (class-validator), вызов use-case, маппинг результата в ответ Discord (embed, defer, ephemeral). Вся бизнес-логика и вызовы ИИ — в use-case.

### ИИ внутри агента

* Если агент «умный» (LLM, RAG, tools): **интерфейс** в domain фичи (или shared/ai), **реализация** в infrastructure или shared/ai.
* Use-case оркестрирует: получить контекст пользователя → вызвать ИИ через интерфейс → сохранить/отправить результат.
* В `discord/` не должно быть вызовов LLM, промптов и tool-логики — только вызов одного use-case (например `AskAiUseCase.execute(dto)`).

### Запреты для агентов

* Не вызывать use-case или сервис **другой фичи** из command/handler (только Events или явный Application API другой фичи, если так спроектировано).
* Не инжектить Prisma, репозитории или внешние API в `discord/` — только use-case(s) своей фичи.
* Не держать в handler длинную процедурную логику (циклы, ветвления по бизнес-правилам) — выносить в use-case.
* Не создавать отдельный Discord-клиент в фиче — использовать shared/discord.

### Long-running и потоковые ответы

* Defer reply при долгом ответе (например от LLM); use-case возвращает поток/итератор или callback — handler только прокидывает в Discord API.
* Таймауты и отмена: обрабатывать в use-case или shared-слое, не размазывать по discord-handler’ам.

---

## При сомнениях

См. `docs/ARCHITECTURE.md` и `docs/DECISIONS.md`.
