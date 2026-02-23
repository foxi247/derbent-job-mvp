import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
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
    return apiError("Недостаточно средств на балансе", 400, { code: "NOT_ENOUGH_BALANCE" });
  }
  if (message === "TARIFF_NOT_FOUND") {
    return apiError("Тариф не найден или отключен", 404, { code: "TARIFF_NOT_FOUND" });
  }
  if (message === "USER_BANNED") {
    return apiError("Аккаунт заблокирован. Публикация недоступна", 403, { code: "USER_BANNED" });
  }
  if (message === "FORBIDDEN") {
    return apiError("Можно публиковать только свои задания", 403, { code: "FORBIDDEN" });
  }

  return apiError("Не удалось опубликовать задание", 500, { code: "PUBLICATION_FAILED" });
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
          profile: true,
          isBanned: true
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
    return apiError("Задание не найдено", 404, { code: "NOT_FOUND", noStore: true });
  }

  if (job.user.isBanned) {
    return apiError("Задание недоступно", 404, { code: "JOB_HIDDEN", noStore: true });
  }

  return jsonResponse(job, { noStore: true });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
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

  const job = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true }
  });

  if (!job) {
    return apiError("Задание не найдено", 404, { code: "NOT_FOUND" });
  }

  if (job.userId !== session.user.id) {
    return apiError("Можно редактировать только свои задания", 403, { code: "FORBIDDEN" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = jobPostPatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const payload = parsed.data;
  const shouldPublish = payload.status === "ACTIVE";

  if (shouldPublish && !payload.tariffPlanId) {
    return apiError("Выберите тариф перед публикацией", 400, { code: "TARIFF_REQUIRED" });
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
    return jsonResponse(updated, { noStore: true });
  }

  try {
    const published = await publishJobByTariff({
      jobPostId: job.id,
      userId: session.user.id,
      tariffPlanId: payload.tariffPlanId as string
    });
    return jsonResponse(published, { noStore: true });
  } catch (error) {
    return mapPublicationError(error);
  }
}

