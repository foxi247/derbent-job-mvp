# Работа/Подработка - Derbent MVP

Двусторонняя платформа для Дербента: исполнители публикуют анкеты, работодатели публикуют задания.

## Стек

- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Next.js Route Handlers (API)
- PostgreSQL + Prisma ORM
- NextAuth/Auth.js (Email magic link + Google + Yandex)

## Что реализовано

- Роли: `EXECUTOR`, `EMPLOYER`, `ADMIN`
- Лента исполнителей (`/`) и лента заданий (`/jobs`)
- Детальные страницы: `/listing/[id]`, `/jobs/[id]`
- Кабинет исполнителя: `/dashboard`
- Кабинет работодателя: `/dashboard-employer`
- Профиль: `/profile`
- Админ-панель: `/admin`

### Баланс и ручные пополнения (MVP)

- У пользователя есть баланс `balanceRub`
- Пользователь создает заявку на пополнение (`TopUpRequest`) на 30 минут
- Показываются реквизиты из `AdminSettings`
- Кнопка «Я оплатил» сохраняет `proofText`
- Админ подтверждает/отклоняет заявку
- При подтверждении баланс увеличивается вручную админом

### Тарифы и публикация

- Тарифы настраиваются в админке (`TariffPlan`): `BASIC` / `PREMIUM` / `GOLD`
- При публикации/продлении:
  - проверяется баланс
  - списывается стоимость тарифа
  - создается `ListingTariff`
  - `expiresAt` у объявления обновляется
- В публичных выдачах показываются только `ACTIVE` и не истекшие
- Истекшие карточки не удаляются, а скрываются

### Premium/Gold выделения

- `BASIC`: обычная карточка
- `PREMIUM`: акцентное оформление + бейдж
- `GOLD`: бейдж + приоритет сортировки
- Сортировка в выдаче: `GOLD -> PREMIUM -> BASIC`, затем `updatedAt desc`

## Prisma модели (новое в этом этапе)

- `User`: `balanceRub`, `isBanned`, `bannedAt`, роль `ADMIN`
- `Profile`: `gender`, `age`, `workCategory`, `previousWork`, `phone`
- `TopUpRequest`
- `AdminSettings`
- `TariffPlan`
- `ListingTariff`

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Скопируйте `.env.example` в `.env` и заполните значения.

3. Примените миграции:

```bash
npm run prisma:migrate
```

4. Сгенерируйте Prisma Client:

```bash
npm run prisma:generate
```

5. Заполните базу тестовыми данными:

```bash
npm run prisma:seed
```

6. Запустите проект:

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
EMAIL_FROM="Работа Дербент <no-reply@example.com>"

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
```

## API (основное)

### Публичные

- `GET /api/listings?query=&category=&online=&urgent=&experienceMin=&experienceMax=&priceType=`
- `GET /api/listings/[id]`
- `GET /api/jobs?query=&category=&payType=&urgent=`
- `GET /api/jobs/[id]`
- `GET /api/tariffs`

### Пользовательские

- `POST /api/listings` (EXECUTOR)
- `PATCH /api/listings/[id]` (owner/admin)
- `POST /api/listings/[id]/promote`
- `POST /api/jobs` (EMPLOYER)
- `PATCH /api/jobs/[id]` (owner/admin)
- `POST /api/jobs/[id]/promote`
- `POST /api/jobs/[id]/complete`
- `POST /api/profile`
- `PATCH /api/profile/status`
- `POST /api/messages` (требует авторизацию)
- `POST /api/reviews` (EMPLOYER)
- `POST /api/contacts/reveal`
- `GET /api/topups`
- `POST /api/topups`
- `POST /api/topups/[id]/confirm`

### Админские

- `GET /api/admin/users`
- `PATCH /api/admin/users/[id]/ban`
- `GET /api/admin/topups`
- `POST /api/admin/topups/[id]/approve`
- `POST /api/admin/topups/[id]/reject`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings`
- `GET /api/admin/tariffs`
- `POST /api/admin/tariffs`
- `PATCH /api/admin/tariffs/[id]`
- `DELETE /api/admin/tariffs/[id]`

## Seed данные

`prisma/seed.ts` создает:

- 12 исполнителей с анкетами и карточками
- 2 работодателя и задания (ACTIVE/PAUSED/COMPLETED)
- 1 админа (`admin@derbent.local`)
- 3 тарифа (`BASIC`, `PREMIUM`, `GOLD`)
- реквизиты для ручного пополнения
- примеры заявок на пополнение с разными статусами
- сообщения и отзывы

## TODO (следующий этап)

- Подключение реальной оплаты (ЮKassa/CloudPayments)
- История транзакций/баланса
- Автоматические фоновые задачи (cron) вместо expire-on-read
- Чаты с привязкой к пользователям и диалогам
