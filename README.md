# ChamBu

Онлайн-меню для кафе ЧамБу в Грозном.

## Структура

- `client` - фронтенд на чистом JavaScript, HTML и CSS.
- `server` - Go API на Gin/Gorm с PostgreSQL, JWT-админкой, заказами и загрузкой фото.
- `server/internal/storage` - Cloudinary-хранилище и сжатие изображений перед загрузкой.

## Локальный запуск

```powershell
cd server
$env:DATABASE_URL="postgres://user:password@localhost:5432/chambu?sslmode=disable"
$env:JWT_SECRET="replace-with-long-random-secret"
go run ./cmd/api
```

Сайт будет доступен на `http://localhost:8080`.
Админка открывается по `http://localhost:8080/#admin` и требует вход.

Если PostgreSQL недоступен, сервер все равно поднимет фронтенд в preview-режиме, а меню покажет локальные fallback-данные.

## GitHub Pages

Для показа клиенту настроена статическая публикация папки `client` через GitHub Actions.
После push в `main` сайт будет доступен по адресу:

```text
https://said-go.github.io/ChamBu/
```

На GitHub Pages работает публичная демо-витрина меню на локальных данных. Админка, сохранение блюд и загрузка фото требуют Go-сервер и PostgreSQL.

## Docker

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Перед production-запуском обязательно поменяйте в `.env`:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Cloudinary

Фото блюд загружаются через админку полем `imageFile`. Перед отправкой изображение сжимается до JPEG шириной 800px и качеством 80.

Поддерживаются переменные:

```powershell
$env:CLOUDINARY_CLOUD_NAME="..."
$env:CLOUDINARY_API_KEY="..."
$env:CLOUDINARY_API_SECRET="..."
```

Также backend принимает короткие алиасы из существующего `.env`: `CLOUD_NAME`, `API_KEY`, `API_SECRET`.

Если Cloudinary не настроен, сайт продолжит работать, но загрузка новых фото вернет понятную ошибку.

## API

- `GET /api/health` - проверка сервера.
- `GET /api/menu` - бренд, фиксированные категории и позиции меню.
- `GET /api/menu/items` - список позиций с фильтрами `category`, `search`, `page`, `limit`.
- `GET /api/menu/items/{slug}` - одна позиция меню по slug.
- `POST /auth/login` - вход администратора.
- `POST /api/admin/items` - создать или обновить позицию меню, JSON или multipart form.
- `PUT /api/admin/items/{numeric_id}` - обновить позицию по внутреннему ID.
- `DELETE /api/admin/items/{slug}` - удалить позицию по slug.
- `POST /orders` - создать заказ.
- `GET /orders` - список заказов для администратора.

Админские запросы принимают JWT из `Authorization: Bearer <token>`.
Категории через админку не создаются: доступны только `Блины`, `Завтраки`, `Напитки`.

Seed-администратор для локального старта:

- email: `admin@chambu.local`
- password: `chambu-admin`

## Домен и Google

Перед выкладкой на домен замените `your-domain.ru` в:

- `client/robots.txt`
- `client/sitemap.xml`
- `deploy/nginx.conf.example`

Для сервера с Nginx можно взять пример из `deploy/nginx.conf.example`: Nginx принимает трафик на домене и проксирует его в приложение на `127.0.0.1:8080`.

После запуска на домене включите HTTPS, добавьте сайт в Google Search Console и отправьте `https://ваш-домен/sitemap.xml`.

## Архитектура backend

- `cmd/api` - точка входа, сборка зависимостей, миграция и seed.
- `internal/config` - конфигурация окружения и подключение PostgreSQL.
- `internal/models` - Gorm-модели и DTO.
- `internal/repository` - работа с БД.
- `internal/service` - бизнес-логика меню, заказов, администраторов и auth.
- `internal/transport` - Gin handlers, роуты и JWT middleware.
- `internal/storage` - Cloudinary и сжатие изображений.
- `internal/utils` - JWT.

## Архитектура frontend

- `src/api` - HTTP-клиент.
- `src/state` - состояние приложения и сценарии.
- `src/views` - рендер меню и админки.
- `src/utils` - форматирование и безопасный вывод текста.
