import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
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

export async function POST(req: NextRequest, context: RouteContext) {
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
    return NextResponse.json({ error: "Можно продлевать только свою анкету" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = publicationTariffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await publishListingByTariff({
      listingId: listing.id,
      userId: session.user.id,
      tariffPlanId: parsed.data.tariffPlanId
    });
    return NextResponse.json(updated);
  } catch (error) {
    return mapPublicationError(error);
  }
}
