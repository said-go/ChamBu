# ChamBu

Онлайн-меню для кафе ЧамБу в Грозном.

## Структура

- `client` - фронтенд на чистом JavaScript, HTML и CSS.
- `server` - Go API и статическая раздача фронтенда.

## Запуск

```powershell
cd server
go run ./cmd/api
```

Откройте `http://localhost:8080`.

## PostgreSQL

Создайте базу и примените SQL из папки `server/migrations` по порядку:

```powershell
psql $env:DATABASE_URL -f migrations/001_init.sql
psql $env:DATABASE_URL -f migrations/002_seed.sql
```

Запуск с PostgreSQL:

```powershell
cd server
$env:DATABASE_URL="postgres://user:password@localhost:5432/chambu?sslmode=disable"
$env:ADMIN_TOKEN="strong-admin-token"
go run ./cmd/api
```

Если `DATABASE_URL` не задан, сервер запускается с read-only fallback-меню.

## API

- `GET /api/health` - проверка сервера.
- `GET /api/menu` - бренд, категории и позиции меню.
- `POST /api/admin/categories` - создать или обновить категорию.
- `DELETE /api/admin/categories/{id}` - удалить категорию.
- `POST /api/admin/items` - создать или обновить позицию.
- `DELETE /api/admin/items/{id}` - удалить позицию.

Админские запросы требуют заголовок `X-Admin-Token` со значением `ADMIN_TOKEN`.

## Архитектура

Бэкенд разделен на слои:

- `cmd/api` - точка входа и сборка зависимостей.
- `internal/config` - конфигурация окружения.
- `internal/httpapi` - HTTP handlers, валидация и ответы API.
- `internal/menu` - доменные модели и репозитории меню.
- `internal/platform/postgres` - подключение к PostgreSQL.

Фронтенд разделен на слои:

- `src/api` - HTTP-клиент.
- `src/state` - состояние приложения и сценарии.
- `src/views` - рендер меню и админки.
- `src/utils` - форматирование и мелкие общие функции.
