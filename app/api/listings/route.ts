import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getListings } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { publishListingByTariff } from "@/lib/tariffs";
import { listingQuerySchema, listingSchema } from "@/lib/validations";

function mapPublicationError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "NOT_ENOUGH_BALANCE") {
    return NextResponse.json({ error: "Недостаточно средств на балансе" }, { status: 400 });
  }

  if (message === "TARIFF_NOT_FOUND") {
    return NextResponse.json({ error: "Тариф не найден или отключен" }, { status: 404 });
  }

  if (message === "USER_BANNED") {
    return NextResponse.json({ error: "Аккаунт заблокирован. Публикация недоступна" }, { status: 403 });
  }

  throw error;
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listingQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const data = parsed.data;
  const listings = await getListings({
    query: data.query,
    category: data.category,
    online: data.online === "true" ? true : data.online === "false" ? false : undefined,
    urgent: data.urgent === "true" ? true : data.urgent === "false" ? false : undefined,
    experienceMin: data.experienceMin,
    experienceMax: data.experienceMax,
    priceType: data.priceType
  });

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EXECUTOR") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    action: "listing_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 10,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много публикаций. Попробуйте чуть позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json();
  const parsed = listingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { phone: true, experienceYears: true, workCategory: true }
  });

  if (!profile?.phone) {
    return NextResponse.json({ error: "Для публикации заполните телефон в профиле" }, { status: 400 });
  }

  if (!profile.workCategory) {
    return NextResponse.json({ error: "Для публикации заполните категорию в профиле" }, { status: 400 });
  }

  const shouldPublish = parsed.data.status === "ACTIVE";
  if (shouldPublish && !parsed.data.tariffPlanId) {
    return NextResponse.json({ error: "Выберите тариф перед публикацией" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      priceType: parsed.data.priceType,
      priceValue: parsed.data.priceValue,
      district: parsed.data.district,
      status: shouldPublish ? "PAUSED" : parsed.data.status,
      city: "DERBENT"
    }
  });

  if (shouldPublish) {
    try {
      const published = await publishListingByTariff({
        listingId: listing.id,
        userId: session.user.id,
        tariffPlanId: parsed.data.tariffPlanId as string
      });

      return NextResponse.json(published, { status: 201 });
    } catch (error) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: "PAUSED" }
      });
      return mapPublicationError(error);
    }
  }

  return NextResponse.json(listing, { status: 201 });
}
