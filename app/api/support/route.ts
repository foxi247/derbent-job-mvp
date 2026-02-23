import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { supportRequestSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (session?.user) {
    try {
      await assertNotBanned(session.user.id);
    } catch {
      return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
    }
  }

  const rateLimit = await checkRateLimit({
    action: "support_request",
    key: buildRateLimitKey(req, session?.user?.id),
    limit: 5,
    windowMs: 10 * 60 * 1000,
    userId: session?.user?.id ?? null
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много обращений. Попробуйте позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = supportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderName: parsed.data.name,
      senderContact: parsed.data.contact,
      text: `[SUPPORT] ${parsed.data.text}`
    }
  });

  return NextResponse.json({ ok: true, id: message.id }, { status: 201 });
}
