import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { getListings } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { publishListingByTariff } from "@/lib/tariffs";
import { listingQuerySchema, listingSchema } from "@/lib/validations";

function mapPublicationError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "NOT_ENOUGH_BALANCE") {
    return apiError("Недостаточно средств на балансе", 400, { code: "NOT_ENOUGH_BALANCE" });
  }

  if (message === "TARIFF_NOT_FOUND") {
    return apiError("Тариф не найден или отключен", 404, { code: "TARIFF_NOT_FOUND" });
  }

  if (message === "USER_BANNED") {
    return apiError("Аккаунт заблокирован. Публикация недоступна", 403, { code: "USER_BANNED" });
  }

  if (message === "FORBIDDEN") {
    return apiError("Можно публиковать только свои анкеты", 403, { code: "FORBIDDEN" });
  }

  if (message === "LISTING_NOT_FOUND") {
    return apiError("Анкета не найдена", 404, { code: "LISTING_NOT_FOUND" });
  }

  return apiError("Не удалось опубликовать анкету. Повторите попытку.", 500, { code: "PUBLICATION_FAILED" });
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listingQuerySchema.safeParse(params);

  if (!parsed.success) {
    return apiValidationError(parsed.error, "Некорректные параметры фильтра");
  }

  const data = parsed.data;
  const listings = await getListings({
    query: data.query,
    category: data.category,
    online: data.online === "true" ? true : data.online === "false" ? false : undefined,
    urgent: data.urgent === "true" ? true : data.urgent === "false" ? false : undefined,
    experienceMin: data.experienceMin,
    experienceMax: data.experienceMax,
    priceType: data.priceType,
    limit: data.limit ?? 24,
    offset: data.offset ?? 0
  });

  return jsonResponse(listings, { noStore: true });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EXECUTOR") {
    return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "USER_BANNED") {
      return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
    }

    return apiError("Пользователь не найден", 404, { code: "USER_NOT_FOUND" });
  }

  const rateLimit = await checkRateLimit({
    action: "listing_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 10,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return apiError("Слишком много публикаций. Попробуйте чуть позже.", 429, {
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = listingSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { phone: true, experienceYears: true, workCategory: true }
  });

  if (!profile?.phone) {
    return apiError("Для публикации заполните телефон в профиле", 400, { code: "PHONE_REQUIRED" });
  }

  if (!profile.workCategory) {
    return apiError("Для публикации заполните категорию в профиле", 400, { code: "CATEGORY_REQUIRED" });
  }

  const shouldPublish = parsed.data.status === "ACTIVE";
  if (shouldPublish && !parsed.data.tariffPlanId) {
    return apiError("Выберите тариф перед публикацией", 400, { code: "TARIFF_REQUIRED" });
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

      return jsonResponse(published, { status: 201, noStore: true });
    } catch (error) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: "PAUSED" }
      });
      return mapPublicationError(error);
    }
  }

  return jsonResponse(listing, { status: 201, noStore: true });
}

