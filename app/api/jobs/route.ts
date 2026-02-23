import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { getJobPosts } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { publishJobByTariff } from "@/lib/tariffs";
import { jobPostSchema, jobQuerySchema } from "@/lib/validations";

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

  if (message === "JOB_NOT_FOUND") {
    return apiError("Задание не найдено", 404, { code: "JOB_NOT_FOUND" });
  }

  return apiError("Не удалось опубликовать задание. Повторите попытку.", 500, { code: "PUBLICATION_FAILED" });
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = jobQuerySchema.safeParse(params);

  if (!parsed.success) {
    return apiValidationError(parsed.error, "Некорректные параметры фильтра");
  }

  const jobs = await getJobPosts({
    query: parsed.data.query,
    category: parsed.data.category,
    payType: parsed.data.payType,
    urgent: parsed.data.urgent === "true" ? true : parsed.data.urgent === "false" ? false : undefined,
    limit: parsed.data.limit ?? 24,
    offset: parsed.data.offset ?? 0
  });

  return jsonResponse(jobs, { noStore: true });
}

export async function POST(req: NextRequest) {
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

  const rateLimit = await checkRateLimit({
    action: "job_create",
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
  const parsed = jobPostSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const shouldPublish = parsed.data.status === "ACTIVE";
  if (shouldPublish && !parsed.data.tariffPlanId) {
    return apiError("Выберите тариф перед публикацией", 400, { code: "TARIFF_REQUIRED" });
  }

  const jobPost = await prisma.jobPost.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      payType: parsed.data.payType,
      payValue: parsed.data.payValue,
      district: parsed.data.district,
      phone: parsed.data.phone,
      urgentToday: parsed.data.urgentToday ?? false,
      status: shouldPublish ? "PAUSED" : parsed.data.status,
      city: "DERBENT"
    }
  });

  if (shouldPublish) {
    try {
      const published = await publishJobByTariff({
        jobPostId: jobPost.id,
        userId: session.user.id,
        tariffPlanId: parsed.data.tariffPlanId as string
      });

      return jsonResponse(published, { status: 201, noStore: true });
    } catch (error) {
      await prisma.jobPost.update({
        where: { id: jobPost.id },
        data: { status: "PAUSED" }
      });
      return mapPublicationError(error);
    }
  }

  return jsonResponse(jobPost, { status: 201, noStore: true });
}

