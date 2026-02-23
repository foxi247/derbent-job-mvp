import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
import { publishJobByTariff } from "@/lib/tariffs";
import { jobPostPatchSchema } from "@/lib/validations";

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
  const job = await prisma.jobPost.findUnique({
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

  if (!job) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true }
  });

  if (!job) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: "Можно редактировать только свои задания" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = jobPostPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const shouldPublish = payload.status === "ACTIVE";

  if (shouldPublish && !payload.tariffPlanId) {
    return NextResponse.json({ error: "Выберите тариф перед публикацией" }, { status: 400 });
  }

  const updated = await prisma.jobPost.update({
    where: { id: job.id },
    data: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.payType !== undefined ? { payType: payload.payType } : {}),
      ...(payload.payValue !== undefined ? { payValue: payload.payValue } : {}),
      ...(payload.district !== undefined ? { district: payload.district } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.urgentToday !== undefined ? { urgentToday: payload.urgentToday } : {}),
      ...(shouldPublish ? { status: "PAUSED" } : payload.status !== undefined ? { status: payload.status } : {})
    }
  });

  if (!shouldPublish) {
    return NextResponse.json(updated);
  }

  try {
    const published = await publishJobByTariff({
      jobPostId: job.id,
      userId: session.user.id,
      tariffPlanId: payload.tariffPlanId as string
    });
    return NextResponse.json(published);
  } catch (error) {
    return mapPublicationError(error);
  }
}
