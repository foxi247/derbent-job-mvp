# Работа/Подработка - Derbent MVP

Двусторонняя платформа для Дербента: работодатели публикуют задания, исполнители размещают услуги и откликаются.

## Стек

- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Next.js Route Handlers (API)
- PostgreSQL + Prisma ORM
- NextAuth/Auth.js (Email magic link + Google + Yandex)

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Скопируйте `.env.example` в `.env` и заполните значения.

3. Примените миграции и сгенерируйте клиент Prisma:

```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Заполните базу тестовыми данными:

```bash
npm run prisma:seed
```

5. Запустите dev-сервер:

```bash
npm run dev
```

## ENV переменные

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_URL=http://localhost:3112
NEXTAUTH_SECRET=

EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
```

## Страницы

- `/` — лента исполнителей (карточки услуг)
- `/listing/[id]` — деталка исполнителя + контакт + отзывы
- `/jobs` — лента заданий работодателей
- `/jobs/[id]` — деталка задания + форма отклика
- `/dashboard` — кабинет исполнителя
- `/dashboard-employer` — кабинет работодателя
- `/profile` — настройки профиля и телефона
- `/auth/signin`, `/auth/role` — авторизация и выбор роли

## API

- `GET /api/listings?query=&category=&online=&urgent=&experienceMin=&experienceMax=&priceType=`
- `POST /api/listings` (только EXECUTOR)
- `GET /api/listings/[id]`
- `PATCH /api/listings/[id]` (только владелец)
- `POST /api/listings/[id]/promote`

- `GET /api/jobs?query=&category=&payType=&urgent=`
- `POST /api/jobs` (только EMPLOYER)
- `GET /api/jobs/[id]`
- `PATCH /api/jobs/[id]` (только владелец)
- `POST /api/jobs/[id]/promote`
- `POST /api/jobs/[id]/complete`

- `POST /api/messages` (универсально для listing/job)
- `POST /api/reviews` (только EMPLOYER, после COMPLETED)
- `POST /api/contacts/reveal` (только авторизованные)

- `POST /api/profile` (create/update)
- `PATCH /api/profile/status`
- `PATCH /api/profile/experience`
- `POST /api/role`

## Что реализовано в этом милстоуне

- JobPost (задания работодателей) с отдельной лентой и деталкой
- Универсальные сообщения: к карточке исполнителя и к заданию работодателя
- Телефон в профиле/задании + безопасный показ по кнопке с логированием просмотров
- Отзывы (Review): рейтинг 1..5, список на карточке исполнителя, пагинация
- Завершение задания работодателем (`COMPLETED`) и форма отзыва
- Demo-продление размещения на 7 дней / 200₽ для Listing и JobPost
- Автоскрытие просроченных публикаций из публичных лент

## Seed

`prisma/seed.ts` создаёт:

- 12 исполнителей с профилями, телефонами и активными карточками
- 2 работодателя, 6 заданий (ACTIVE/PAUSED/COMPLETED)
- 2 отзыва по завершённому заданию
- двусторонние сообщения (по `listingId` и `jobPostId`)
- тарифы, включая базовый `7 дней / 200₽`

## TODO: монетизация (после MVP)

- [ ] Реальная оплата (ЮKassa/CloudPayments)
- [ ] Поднятие в топ и выделение карточек
- [ ] История платежей и вебхуки
- [ ] Лимиты по ролям/тарифам

## Примечания

- Площадка сейчас ограничена городом Дербент.
- Готова архитектура для расширения по Дагестану (через enum `City`).
