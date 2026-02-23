import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { TOP_UP_EXPIRES_MINUTES } from "@/lib/constants";
import { expireEntities } from "@/lib/lifecycle";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { topUpCreateSchema, topUpQuerySchema } from "@/lib/validations";

function getTopUpExpiryDate() {
  return new Date(Date.now() + TOP_UP_EXPIRES_MINUTES * 60 * 1000);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  await expireEntities();

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = topUpQuerySchema.safeParse(params);

  if (!parsed.success) {
    return apiValidationError(parsed.error, "Некорректные параметры");
  }

  const [user, requests, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { balanceRub: true } }),
    prisma.topUpRequest.findMany({
      where: {
        userId: session.user.id,
        ...(parsed.data.status ? { status: parsed.data.status } : {})
      },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    prisma.adminSettings.findFirst({ orderBy: { updatedAt: "desc" } })
  ]);

  return jsonResponse(
    {
      balanceRub: user?.balanceRub ?? 0,
      requisites: settings,
      requests,
      serverNow: new Date().toISOString()
    },
    { noStore: true }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
  }

  const rateLimit = await checkRateLimit({
    action: "topup_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 6,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return apiError("Слишком много заявок на пополнение. Попробуйте чуть позже.", 429, {
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = topUpCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const request = await prisma.topUpRequest.create({
    data: {
      userId: session.user.id,
      amountRub: parsed.data.amountRub,
      status: "PENDING",
      expiresAt: getTopUpExpiryDate()
    }
  });

  const requisites = await prisma.adminSettings.findFirst({ orderBy: { updatedAt: "desc" } });

  return jsonResponse(
    {
      request,
      requisites,
      serverNow: new Date().toISOString()
    },
    { status: 201, noStore: true }
  );
}

