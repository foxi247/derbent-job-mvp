import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { reportCreateSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    action: "report_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 10,
    windowMs: 10 * 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много жалоб. Попробуйте позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reportCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.targetType === "LISTING") {
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId as string },
      select: { id: true, userId: true }
    });

    if (!listing) {
      return NextResponse.json({ error: "Анкета не найдена" }, { status: 404 });
    }

    if (listing.userId === session.user.id) {
      return NextResponse.json({ error: "Нельзя пожаловаться на свою анкету" }, { status: 400 });
    }
  }

  if (parsed.data.targetType === "JOB") {
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: parsed.data.jobPostId as string },
      select: { id: true, userId: true }
    });

    if (!jobPost) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    if (jobPost.userId === session.user.id) {
      return NextResponse.json({ error: "Нельзя пожаловаться на свое задание" }, { status: 400 });
    }
  }

  if (parsed.data.targetType === "USER") {
    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.data.targetUserId as string },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: "Нельзя пожаловаться на себя" }, { status: 400 });
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

  return NextResponse.json(report, { status: 201 });
}
