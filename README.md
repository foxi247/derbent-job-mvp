# Работа/Подработка — Derbent Job MVP

Двусторонняя платформа для Дербента:
- исполнители публикуют анкеты услуг
- работодатели публикуют задания
- есть отклики, сообщения, отзывы, избранное, уведомления, тарифы и ручное пополнение баланса

## Стек
- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Next.js Route Handlers
- PostgreSQL + Prisma
- NextAuth/Auth.js (Email + Google + Yandex + demo credentials для dev)

## Основные возможности
- Роли: `EXECUTOR`, `EMPLOYER`, `ADMIN`
- Ленты: `/` (исполнители), `/jobs` (задания)
- Детальные страницы: `/listing/[id]`, `/jobs/[id]`
- Отклики по заданиям (pipeline): `SENT/VIEWED/ACCEPTED/REJECTED/COMPLETED/CANCELED`
- Кабинеты: `/dashboard`, `/dashboard-employer`
- Избранное: `/favorites`
- Сохраненные поиски: `/saved-searches`
- In-app уведомления: `/notifications`
- Жалобы + модерация в админке
- Баланс и ручные пополнения с подтверждением админом
- Тарифы `BASIC/PREMIUM/GOLD` с приоритетом в выдаче
- SEO база: metadata, canonical, `sitemap.xml`, `robots.txt`

## Локальный запуск
1. Установка зависимостей:
```bash
npm install
```

2. Создать `.env` из `.env.example`.

3. Применить миграции:
```bash
npm run prisma:migrate
```

4. Сгенерировать Prisma Client:
```bash
npm run prisma:generate
```

5. Наполнить базу тестовыми данными:
```bash
npm run prisma:seed
```

6. Запустить dev-сервер:
```bash
npm run dev
```

## ENV
```env
DATABASE_URL=
DIRECT_URL=

NEXTAUTH_URL=http://localhost:3112
NEXTAUTH_SECRET=
PUBLIC_BASE_URL=http://localhost:3112

EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM="Работа Дербент <no-reply@example.com>"

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
```

## Основные страницы
- `/` — исполнители + поиск/фильтры
- `/jobs` — задания + поиск/фильтры
- `/listing/[id]` — карточка исполнителя, контакты, отзывы
- `/jobs/[id]` — карточка задания, отклик, контакты
- `/dashboard` — кабинет исполнителя + мои отклики
- `/dashboard-employer` — кабинет работодателя + отклики
- `/favorites` — избранные анкеты и задания
- `/saved-searches` — сохраненные фильтры
- `/notifications` — уведомления
- `/admin` — пользователи, пополнения, тарифы, реквизиты, жалобы
- `/how-it-works`, `/privacy`, `/terms`, `/support`

## Ключевые API
Публичные:
- `GET /api/listings`
- `GET /api/listings/[id]`
- `GET /api/jobs`
- `GET /api/jobs/[id]`

Пользовательские:
- `POST /api/listings`, `PATCH /api/listings/[id]`
- `POST /api/jobs`, `PATCH /api/jobs/[id]`
- `POST /api/jobs/[id]/apply`
- `GET /api/job-applications`, `PATCH /api/job-applications/[id]/status`
- `POST /api/messages`
- `GET/POST/DELETE /api/favorites`
- `GET/POST /api/saved-searches`, `DELETE /api/saved-searches/[id]`
- `GET /api/notifications`, `POST /api/notifications/read-all`
- `POST /api/reports`
- `GET/POST /api/topups`, `POST /api/topups/[id]/confirm`
- `POST /api/support`

Админские:
- `GET /api/admin/users`, `PATCH /api/admin/users/[id]/ban`
- `GET /api/admin/topups`, `POST /api/admin/topups/[id]/approve`, `POST /api/admin/topups/[id]/reject`
- `GET/PATCH /api/admin/settings`
- `GET/POST /api/admin/tariffs`, `PATCH/DELETE /api/admin/tariffs/[id]`
- `GET /api/admin/reports`, `PATCH /api/admin/reports/[id]/resolve`

## Seed
`prisma/seed.ts` создает:
- демо-админа
- исполнителей и работодателей
- 10+ анкет и задания по Дербенту
- тарифы `BASIC/PREMIUM/GOLD`
- реквизиты для ручного пополнения
- примеры откликов, избранного, сохраненных поисков, уведомлений и жалоб

## TODO монетизации
- Реальная оплата (ЮKassa/CloudPayments)
- История транзакций баланса
- Автопродление тарифов
- Платные бусты: поднятие в топ, выделение цветом, пакетные размещения
