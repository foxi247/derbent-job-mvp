import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { publishListingByTariff } from "@/lib/tariffs";
import { publicationTariffSchema } from "@/lib/validations";

type RouteContext = {
  params: {
    id: string;
  };
};

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
    return apiError("Можно продлевать только свою анкету", 403, { code: "FORBIDDEN" });
  }
  if (message === "LISTING_NOT_FOUND") {
    return apiError("Анкета не найдена", 404, { code: "LISTING_NOT_FOUND" });
  }

  return apiError("Не удалось продлить публикацию", 500, { code: "PROMOTION_FAILED" });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXECUTOR") {
    return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
  }

  const rateLimit = await checkRateLimit({
    action: "listing_promote",
    key: buildRateLimitKey(req, session.user.id),
    limit: 12,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return apiError("Слишком много попыток продления. Попробуйте чуть позже.", 429, {
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true }
  });

  if (!listing) {
    return apiError("Анкета не найдена", 404, { code: "NOT_FOUND" });
  }

  if (listing.userId !== session.user.id) {
    return apiError("Можно продлевать только свою анкету", 403, { code: "FORBIDDEN" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = publicationTariffSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  try {
    const updated = await publishListingByTariff({
      listingId: listing.id,
      userId: session.user.id,
      tariffPlanId: parsed.data.tariffPlanId
    });
    return jsonResponse(updated, { noStore: true });
  } catch (error) {
    return mapPublicationError(error);
  }
}

