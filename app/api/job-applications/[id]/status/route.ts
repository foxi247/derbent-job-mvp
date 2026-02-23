import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
import { createNotificationSafe } from "@/lib/notifications";
import { jobApplicationStatusSchema } from "@/lib/validations";

type RouteContext = {
  params: {
    id: string;
  };
};

const statusLabel: Record<string, string> = {
  VIEWED: "Просмотрено",
  ACCEPTED: "Принято",
  REJECTED: "Отклонено",
  COMPLETED: "Завершено",
  CANCELED: "Отменено"
};

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

  const body = await req.json().catch(() => ({}));
  const parsed = jobApplicationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
    return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
  }

  if (application.employerUserId !== session.user.id) {
    return NextResponse.json({ error: "Можно менять статус только своих откликов" }, { status: 403 });
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

  return NextResponse.json(updated);
}
