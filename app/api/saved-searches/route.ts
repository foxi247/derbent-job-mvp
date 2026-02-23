import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { savedSearchCreateSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const rows = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    action: "saved_search_create",
    key: buildRateLimitKey(req, session.user.id),
    limit: 20,
    windowMs: 60 * 60 * 1000,
    userId: session.user.id
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Слишком много сохраненных поисков. Попробуйте позже." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = savedSearchCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId: session.user.id,
      type: parsed.data.type,
      queryParams: parsed.data.queryParams
    }
  });

  return NextResponse.json(savedSearch, { status: 201 });
}
