# Работа/Подработка - Derbent MVP

MVP-платформа для поиска исполнителей и найма в городе Дербент.

## Стек

- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui (минимальный набор компонентов)
- Next.js Route Handlers (API)
- PostgreSQL + Prisma ORM
- NextAuth/Auth.js (Email magic link + Google + Yandex)

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Скопируйте `.env.example` в `.env` и заполните значения.

3. Сгенерируйте Prisma клиент и примените миграцию:

```bash
npm run prisma:generate
npm run prisma:migrate
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

## Реализовано в MVP

- Главная `/`:
  - поиск по title/category/description
  - фильтры category, priceType, online, urgent, experience
  - список карточек исполнителей
- Страница объявления `/listing/[id]`:
  - подробная карточка + профиль исполнителя
  - форма "Написать" (`POST /api/messages`)
- Кабинет исполнителя `/dashboard`:
  - создание/редактирование/пауза объявления
  - быстрый выбор стажа прямо в форме объявления
  - статус-тогглы `isOnline`, `urgentToday`
- Профиль `/profile`:
  - about, стаж, навыки, доступность
- Авторизация `/auth/signin`:
  - Email magic link
  - Google OAuth
  - Yandex OAuth
- Выбор роли `/auth/role`:
  - EXECUTOR или EMPLOYER

## API

- `GET /api/listings?query=&category=&online=&urgent=&experienceMin=&experienceMax=&priceType=`
- `POST /api/listings` (только EXECUTOR)
- `GET /api/listings/[id]`
- `PATCH /api/listings/[id]` (только владелец)
- `POST /api/profile` (create/update)
- `PATCH /api/profile/experience`
- `PATCH /api/profile/status`
- `POST /api/messages`
- `POST /api/role`

## Seed

`prisma/seed.ts` добавляет:

- 12 исполнителей по категориям (уборка, грузчики, курьер, няня, строительство, бариста и т.д.)
- профили исполнителей (стаж, навыки, online/urgent)
- 12 активных объявлений в Дербенте
- 3 тарифных плана (заглушка для монетизации)

## Архитектура на расширение города

Сейчас везде используется `City.DERBENT`, но заложен enum `City` в Prisma. Дальше можно:

- добавить `MAKHACHKALA`, `KHASAVYURT` и т.д.
- вынести города в отдельную таблицу
- включить city-switch в UI и фильтры

## TODO: монетизация

- [ ] Платное размещение на 1/7/30 дней
- [ ] Поднятие объявления в топ выдачи
- [ ] Цветовое выделение карточки
- [ ] Статусы продвижения и история платежей
- [ ] Вебхуки оплаты (ЮKassa/CloudPayments)

## Примечания

- Интерфейс полностью на русском языке.
- Сайт в MVP явно ограничен городом Дербент.
- Телефон не обязательный, контакт в сообщениях свободный (email/мессенджер).

