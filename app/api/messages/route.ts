import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Войдите в аккаунт, чтобы написать сообщение", 401, { code: "UNAUTHORIZED" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
  }

  const rateLimit = await checkRateLimit({
    action: "message_post",
    key: buildRateLimitKey(req, session.user.id),
    limit: 20,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return apiError("Слишком много сообщений. Попробуйте чуть позже.", 429, {
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (parsed.data.listingId) {
    const exists = await prisma.listing.findUnique({ where: { id: parsed.data.listingId }, select: { id: true } });
    if (!exists) {
      return apiError("Карточка исполнителя не найдена", 404, { code: "LISTING_NOT_FOUND" });
    }
  }

  if (parsed.data.jobPostId) {
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: parsed.data.jobPostId },
      select: { id: true, userId: true }
    });
    if (!jobPost) {
      return apiError("Задание не найдено", 404, { code: "JOB_NOT_FOUND" });
    }

    if (session.user.role === "EXECUTOR") {
      const application = await prisma.jobApplication.findUnique({
        where: {
          jobPostId_executorUserId: {
            jobPostId: jobPost.id,
            executorUserId: session.user.id
          }
        },
        select: { status: true }
      });

      if (!application || (application.status !== "ACCEPTED" && application.status !== "COMPLETED")) {
        return apiError("Переписка по заданию доступна после принятого отклика.", 403, {
          code: "APPLICATION_NOT_ACCEPTED"
        });
      }
    }
  }

  const message = await prisma.message.create({
    data: {
      listingId: parsed.data.listingId ?? null,
      jobPostId: parsed.data.jobPostId ?? null,
      senderName: parsed.data.senderName,
      senderContact: parsed.data.senderContact,
      text: parsed.data.text
    }
  });

  return jsonResponse(message, { status: 201, noStore: true });
}

