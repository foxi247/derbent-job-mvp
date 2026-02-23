import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { reportCreateSchema } from "@/lib/validations";

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
    action: "report_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 10,
    windowMs: 10 * 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return apiError("Слишком много жалоб. Попробуйте позже.", 429, {
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reportCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (parsed.data.targetType === "LISTING") {
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId as string },
      select: { id: true, userId: true }
    });

    if (!listing) {
      return apiError("Анкета не найдена", 404, { code: "LISTING_NOT_FOUND" });
    }

    if (listing.userId === session.user.id) {
      return apiError("Нельзя пожаловаться на свою анкету", 400, { code: "INVALID_TARGET" });
    }
  }

  if (parsed.data.targetType === "JOB") {
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: parsed.data.jobPostId as string },
      select: { id: true, userId: true }
    });

    if (!jobPost) {
      return apiError("Задание не найдено", 404, { code: "JOB_NOT_FOUND" });
    }

    if (jobPost.userId === session.user.id) {
      return apiError("Нельзя пожаловаться на свое задание", 400, { code: "INVALID_TARGET" });
    }
  }

  if (parsed.data.targetType === "USER") {
    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.data.targetUserId as string },
      select: { id: true }
    });

    if (!targetUser) {
      return apiError("Пользователь не найден", 404, { code: "USER_NOT_FOUND" });
    }

    if (targetUser.id === session.user.id) {
      return apiError("Нельзя пожаловаться на себя", 400, { code: "INVALID_TARGET" });
    }
  }

  const report = await prisma.report.create({
    data: {
      reporterUserId: session.user.id,
      targetType: parsed.data.targetType,
      listingId: parsed.data.listingId ?? null,
      jobPostId: parsed.data.jobPostId ?? null,
      targetUserId: parsed.data.targetUserId ?? null,
      reason: parsed.data.reason,
      text: parsed.data.text ?? null
    }
  });

  return jsonResponse(report, { status: 201, noStore: true });
}

