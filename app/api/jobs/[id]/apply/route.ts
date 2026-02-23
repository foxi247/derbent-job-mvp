import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { createNotificationSafe } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { jobApplicationCreateSchema } from "@/lib/validations";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXECUTOR") {
    return apiError("Отклик доступен только исполнителю", 403, { code: "FORBIDDEN" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
  }

  const rateLimit = await checkRateLimit({
    action: "job_apply",
    key: buildRateLimitKey(req, session.user.id),
    limit: 15,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return apiError("Слишком много откликов. Попробуйте чуть позже.", 429, {
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = jobApplicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true, title: true, status: true, expiresAt: true }
  });

  if (!job) {
    return apiError("Задание не найдено", 404, { code: "NOT_FOUND" });
  }

  if (job.userId === session.user.id) {
    return apiError("Нельзя откликнуться на собственное задание", 400, { code: "INVALID_TARGET" });
  }

  if (job.status !== "ACTIVE" || !job.expiresAt || job.expiresAt <= new Date()) {
    return apiError("Откликнуться можно только на активное задание", 400, { code: "JOB_NOT_ACTIVE" });
  }

  let created = false;
  let application = null as
    | {
        id: string;
        jobPostId: string;
        executorUserId: string;
        employerUserId: string;
        status: "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELED";
        message: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    | null;

  try {
    application = await prisma.jobApplication.create({
      data: {
        jobPostId: job.id,
        executorUserId: session.user.id,
        employerUserId: job.userId,
        status: "SENT",
        message: parsed.data.message?.trim() || null
      }
    });
    created = true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }

    application = await prisma.jobApplication.findUnique({
      where: {
        jobPostId_executorUserId: {
          jobPostId: job.id,
          executorUserId: session.user.id
        }
      }
    });
  }

  if (!application) {
    return apiError("Не удалось создать отклик. Повторите попытку.", 500, { code: "APPLICATION_CREATE_FAILED" });
  }

  if (created) {
    await createNotificationSafe({
      userId: job.userId,
      type: "APPLICATION_NEW",
      title: "Новый отклик",
      body: `По заданию «${job.title}» пришел новый отклик.`,
      link: "/dashboard-employer"
    });
  }

  return jsonResponse(application, { status: created ? 201 : 200, noStore: true });
}

