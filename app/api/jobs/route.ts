import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobPosts } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { publishJobByTariff } from "@/lib/tariffs";
import { jobPostSchema, jobQuerySchema } from "@/lib/validations";

function mapPublicationError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "NOT_ENOUGH_BALANCE") {
    return NextResponse.json({ error: "Недостаточно средств на балансе" }, { status: 400 });
  }

  if (message === "TARIFF_NOT_FOUND") {
    return NextResponse.json({ error: "Тариф не найден или отключен" }, { status: 404 });
  }

  if (message === "USER_BANNED") {
    return NextResponse.json({ error: "Аккаунт заблокирован. Публикация недоступна" }, { status: 403 });
  }

  throw error;
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = jobQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const jobs = await getJobPosts({
    query: parsed.data.query,
    category: parsed.data.category,
    payType: parsed.data.payType,
    urgent: parsed.data.urgent === "true" ? true : parsed.data.urgent === "false" ? false : undefined
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    action: "job_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 10,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много публикаций. Попробуйте чуть позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json();
  const parsed = jobPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const shouldPublish = parsed.data.status === "ACTIVE";
  if (shouldPublish && !parsed.data.tariffPlanId) {
    return NextResponse.json({ error: "Выберите тариф перед публикацией" }, { status: 400 });
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

      return NextResponse.json(published, { status: 201 });
    } catch (error) {
      await prisma.jobPost.update({
        where: { id: jobPost.id },
        data: { status: "PAUSED" }
      });
      return mapPublicationError(error);
    }
  }

  return NextResponse.json(jobPost, { status: 201 });
}
