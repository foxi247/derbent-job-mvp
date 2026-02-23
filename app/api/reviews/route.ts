import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { reviewQuerySchema, reviewSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = reviewQuerySchema.safeParse(params);

  if (!parsed.success) {
    return apiValidationError(parsed.error, "Некорректные параметры");
  }

  if (!parsed.data.executorUserId && !parsed.data.jobPostId) {
    return apiError("Укажите executorUserId или jobPostId", 400, { code: "MISSING_TARGET" });
  }

  const limit = parsed.data.limit ?? 10;
  const offset = parsed.data.offset ?? 0;

  const where = {
    ...(parsed.data.executorUserId ? { executorUserId: parsed.data.executorUserId } : {}),
    ...(parsed.data.jobPostId ? { jobPostId: parsed.data.jobPostId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        employer: { select: { id: true, name: true } },
        jobPost: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    }),
    prisma.review.count({ where })
  ]);

  return jsonResponse(
    {
      items,
      total,
      limit,
      offset
    },
    { noStore: true }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const jobPost = await prisma.jobPost.findUnique({
    where: { id: parsed.data.jobPostId },
    select: { id: true, userId: true, status: true }
  });

  if (!jobPost) {
    return apiError("Задание не найдено", 404, { code: "JOB_NOT_FOUND" });
  }

  if (jobPost.userId !== session.user.id) {
    return apiError("Можно оставлять отзыв только по своим заданиям", 403, { code: "FORBIDDEN" });
  }

  if (jobPost.status !== "COMPLETED") {
    return apiError("Сначала завершите задание", 400, { code: "JOB_NOT_COMPLETED" });
  }

  const executor = await prisma.user.findUnique({
    where: { id: parsed.data.executorUserId },
    select: { id: true, role: true, isBanned: true }
  });

  if (!executor || executor.role !== "EXECUTOR") {
    return apiError("Исполнитель не найден", 404, { code: "EXECUTOR_NOT_FOUND" });
  }

  if (executor.isBanned) {
    return apiError("Нельзя оставить отзыв заблокированному пользователю", 400, { code: "EXECUTOR_BANNED" });
  }

  try {
    const review = await prisma.review.create({
      data: {
        jobPostId: parsed.data.jobPostId,
        employerUserId: session.user.id,
        executorUserId: parsed.data.executorUserId,
        rating: parsed.data.rating,
        text: parsed.data.text ?? null
      }
    });

    return jsonResponse(review, { status: 201, noStore: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("Отзыв по этому исполнителю и заданию уже оставлен", 409, { code: "REVIEW_ALREADY_EXISTS" });
    }

    return apiError("Не удалось сохранить отзыв", 500, { code: "REVIEW_CREATE_FAILED" });
  }
}

