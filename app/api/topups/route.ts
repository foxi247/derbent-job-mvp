import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOP_UP_EXPIRES_MINUTES } from "@/lib/constants";
import { expireEntities } from "@/lib/lifecycle";
import { assertNotBanned } from "@/lib/access";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { topUpCreateSchema, topUpQuerySchema } from "@/lib/validations";

function getTopUpExpiryDate() {
  return new Date(Date.now() + TOP_UP_EXPIRES_MINUTES * 60 * 1000);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  await expireEntities();

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = topUpQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
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

  return NextResponse.json({
    balanceRub: user?.balanceRub ?? 0,
    requisites: settings,
    requests,
    serverNow: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    action: "topup_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 6,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много заявок на пополнение. Попробуйте чуть позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json();
  const parsed = topUpCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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

  return NextResponse.json(
    {
      request,
      requisites,
      serverNow: new Date().toISOString()
    },
    { status: 201 }
  );
}
