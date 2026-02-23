import { JobApplicationStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { createNotificationSafe } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { jobApplicationStatusSchema } from "@/lib/validations";

type RouteContext = {
  params: {
    id: string;
  };
};

const statusLabel: Record<JobApplicationStatus, string> = {
  SENT: "Отправлен",
  VIEWED: "Просмотрен",
  ACCEPTED: "Принят",
  REJECTED: "Отклонен",
  COMPLETED: "Завершен",
  CANCELED: "Отменен"
};

const transitionMap: Record<JobApplicationStatus, JobApplicationStatus[]> = {
  SENT: ["VIEWED", "ACCEPTED", "REJECTED"],
  VIEWED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["COMPLETED", "CANCELED"],
  REJECTED: [],
  COMPLETED: [],
  CANCELED: []
};

function canTransition(from: JobApplicationStatus, to: JobApplicationStatus) {
  if (from === to) {
    return true;
  }
  return transitionMap[from].includes(to);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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
  const parsed = jobApplicationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: context.params.id },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (!application) {
    return apiError("Отклик не найден", 404, { code: "NOT_FOUND" });
  }

  if (application.employerUserId !== session.user.id) {
    return apiError("Можно менять статус только своих откликов", 403, { code: "FORBIDDEN" });
  }

  if (!canTransition(application.status, parsed.data.status)) {
    return apiError("Недопустимая смена статуса", 400, { code: "INVALID_STATUS_TRANSITION" });
  }

  if (application.status === parsed.data.status) {
    return jsonResponse(application, { noStore: true });
  }

  const updated = await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      status: parsed.data.status
    }
  });

  await createNotificationSafe({
    userId: application.executorUserId,
    type: "APPLICATION_STATUS_CHANGED",
    title: "Обновлен статус отклика",
    body: `Отклик по заданию «${application.jobPost.title}»: ${statusLabel[parsed.data.status]}.`,
    link: "/dashboard"
  });

  return jsonResponse(updated, { noStore: true });
}

