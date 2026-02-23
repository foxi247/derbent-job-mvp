import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";
import { assertNotBanned } from "@/lib/access";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Войдите в аккаунт, чтобы написать сообщение" }, { status: 401 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    action: "message_post",
    key: buildRateLimitKey(req, session.user.id),
    limit: 20,
    windowMs: 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много сообщений. Попробуйте чуть позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.listingId) {
    const exists = await prisma.listing.findUnique({ where: { id: parsed.data.listingId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Карточка исполнителя не найдена" }, { status: 404 });
    }
  }

  if (parsed.data.jobPostId) {
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: parsed.data.jobPostId },
      select: { id: true, userId: true }
    });
    if (!jobPost) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
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
        return NextResponse.json(
          { error: "Переписка по заданию доступна после принятого отклика." },
          { status: 403 }
        );
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

  return NextResponse.json(message, { status: 201 });
}
