import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { topUpConfirmSchema } from "@/lib/validations";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = topUpConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const topUpRequest = await prisma.topUpRequest.findUnique({
    where: { id: context.params.id }
  });

  if (!topUpRequest || topUpRequest.userId !== session.user.id) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (topUpRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Подтверждение доступно только для заявок в ожидании" }, { status: 400 });
  }

  if (topUpRequest.expiresAt <= new Date()) {
    const expired = await prisma.topUpRequest.update({
      where: { id: topUpRequest.id },
      data: { status: "EXPIRED" }
    });

    return NextResponse.json({ error: "Время оплаты истекло", request: expired }, { status: 400 });
  }

  const updated = await prisma.topUpRequest.update({
    where: { id: topUpRequest.id },
    data: {
      proofText: parsed.data.proofText ?? null
    }
  });

  return NextResponse.json(updated);
}
