import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
import { publishListingByTariff } from "@/lib/tariffs";
import { listingPatchSchema } from "@/lib/validations";

type RouteContext = {
  params: {
    id: string;
  };
};

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

export async function GET(_: NextRequest, context: RouteContext) {
  const listing = await prisma.listing.findUnique({
    where: { id: context.params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: true
        }
      },
      tariffs: {
        where: { status: "ACTIVE", endsAt: { gt: new Date() } },
        include: { tariffPlan: true },
        orderBy: { endsAt: "desc" },
        take: 1
      }
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "Анкета не найдена" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXECUTOR") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true }
  });

  if (!listing) {
    return NextResponse.json({ error: "Анкета не найдена" }, { status: 404 });
  }

  if (listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Можно редактировать только свою анкету" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = listingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const shouldPublish = payload.status === "ACTIVE";

  if (shouldPublish && !payload.tariffPlanId) {
    return NextResponse.json({ error: "Выберите тариф перед публикацией" }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.priceType !== undefined ? { priceType: payload.priceType } : {}),
      ...(payload.priceValue !== undefined ? { priceValue: payload.priceValue } : {}),
      ...(payload.district !== undefined ? { district: payload.district } : {}),
      ...(shouldPublish ? { status: "PAUSED" } : payload.status !== undefined ? { status: payload.status } : {})
    }
  });

  if (!shouldPublish) {
    return NextResponse.json(updated);
  }

  try {
    const published = await publishListingByTariff({
      listingId: listing.id,
      userId: session.user.id,
      tariffPlanId: payload.tariffPlanId as string
    });
    return NextResponse.json(published);
  } catch (error) {
    return mapPublicationError(error);
  }
}
