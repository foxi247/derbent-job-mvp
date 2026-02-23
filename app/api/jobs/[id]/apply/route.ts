import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
import { createNotificationSafe } from "@/lib/notifications";
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
    return NextResponse.json({ error: "Отклик доступен только исполнителю" }, { status: 403 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    action: "job_apply",
    key: buildRateLimitKey(req, session.user.id),
    limit: 15,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много откликов. Попробуйте чуть позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = jobApplicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true, title: true, status: true, expiresAt: true }
  });

  if (!job) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  if (job.userId === session.user.id) {
    return NextResponse.json({ error: "Нельзя откликнуться на собственное задание" }, { status: 400 });
  }

  if (job.status !== "ACTIVE" || !job.expiresAt || job.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Откликнуться можно только на активное задание" }, { status: 400 });
  }

  const existing = await prisma.jobApplication.findUnique({
    where: {
      jobPostId_executorUserId: {
        jobPostId: job.id,
        executorUserId: session.user.id
      }
    }
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobPostId: job.id,
      executorUserId: session.user.id,
      employerUserId: job.userId,
      status: "SENT",
      message: parsed.data.message?.trim() || null
    }
  });

  await createNotificationSafe({
    userId: job.userId,
    type: "APPLICATION_NEW",
    title: "Новый отклик",
    body: `По заданию «${job.title}» пришел новый отклик.`,
    link: "/dashboard-employer"
  });

  return NextResponse.json(application, { status: 201 });
}
