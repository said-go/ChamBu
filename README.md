# ChamBu

Онлайн-меню для кафе ЧамБу в Грозном.

## Структура

- `client` - фронтенд на чистом JavaScript, HTML и CSS.
- `server` - Go API на Gin/Gorm с PostgreSQL, админкой, заказами и загрузкой изображений.

## Запуск

```powershell
cd server
$env:DATABASE_URL="postgres://user:password@localhost:5432/chambu?sslmode=disable"
go run ./cmd/api
```

Откройте `http://localhost:8080`.
Админка доступна по `http://localhost:8080/#admin`.
Сначала открывается экран входа. Без JWT админская панель не показывает рабочий интерфейс.
Если PostgreSQL недоступен, сервер всё равно поднимет фронтенд в preview-режиме, а меню покажет локальные fallback-данные.

## PostgreSQL

Бэкенд выполняет `AutoMigrate` при старте. SQL-миграции также лежат в `server/migrations` для ручного применения или будущего migration runner:

```powershell
psql $env:DATABASE_URL -f migrations/001_init.sql
psql $env:DATABASE_URL -f migrations/002_seed.sql
```

Можно использовать либо `DATABASE_URL`, либо набор переменных:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`

## Хранилище фото

Позиции меню можно создавать через multipart form с полем `imageFile`. Перед отправкой в хранилище фото сжимается до JPEG шириной 800px и качеством 80.

Переменные для Cloudinary:

```powershell
$env:STORAGE_DRIVER="cloudinary"
$env:CLOUDINARY_CLOUD_NAME="..."
$env:CLOUDINARY_API_KEY="..."
$env:CLOUDINARY_API_SECRET="..."
```

Если Cloudinary не настроен, используется Yandex storage fallback из `internal/storage/yandex.go`.

## API

- `GET /api/health` - проверка сервера.
- `GET /api/menu` - бренд, категории и позиции меню.
- `GET /api/menu/items` - список позиций с фильтрами `category`, `search`, `page`, `limit`.
- `POST /api/admin/items` - создать или обновить позицию меню; поддерживает JSON и multipart form.
- `PUT /api/admin/items/{id}` - обновить позицию по numeric ID.
- `DELETE /api/admin/items/{id}` - удалить позицию по slug.
- `POST /orders` - создать заказ.
- `GET /orders` - список заказов для администратора.

Админские запросы принимают JWT из `Authorization: Bearer <token>` после `/auth/login`.
Категории не создаются через админку: доступны только фиксированные `Блины`, `Завтраки`, `Напитки`.

Seed-администратор для локального старта:

- email: `admin@chambu.local`
- password: `chambu-admin`

## Архитектура backend

- `cmd/api` - точка входа, сборка зависимостей, миграция и seed.
- `internal/config` - конфигурация окружения и подключение PostgreSQL.
- `internal/models` - Gorm-модели и DTO.
- `internal/repository` - работа с БД.
- `internal/service` - бизнес-логика меню, заказов, администраторов и auth.
- `internal/transport` - Gin handlers, роуты и admin auth middleware.
- `internal/storage` - Cloudinary/Yandex storage и сжатие изображений.
- `internal/utils` - JWT.

## Архитектура frontend

- `src/api` - HTTP-клиент.
- `src/state` - состояние приложения и сценарии.
- `src/views` - рендер меню и админки.
- `src/utils` - форматирование и общие функции.
