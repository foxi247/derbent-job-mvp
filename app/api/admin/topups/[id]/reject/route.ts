import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { createNotificationSafe } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { topUpAdminActionSchema } from "@/lib/validations";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const body = await req.json().catch(() => ({}));
  const parsed = topUpAdminActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const topUpRequest = await prisma.topUpRequest.findUnique({ where: { id: context.params.id } });

  if (!topUpRequest) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (topUpRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Можно отклонять только заявки в ожидании" }, { status: 400 });
  }

  const nextStatus = topUpRequest.expiresAt <= new Date() ? "EXPIRED" : "REJECTED";

  const updated = await prisma.topUpRequest.update({
    where: { id: topUpRequest.id },
    data: {
      status: nextStatus,
      approverUserId: authResult.session.user.id,
      adminNote: parsed.data.adminNote ?? null
    }
  });

  await createNotificationSafe({
    userId: updated.userId,
    type: "TOPUP_REJECTED",
    title: nextStatus === "EXPIRED" ? "Заявка на пополнение истекла" : "Пополнение отклонено",
    body:
      nextStatus === "EXPIRED"
        ? `Заявка на ${updated.amountRub} ₽ истекла по времени.`
        : `Заявка на ${updated.amountRub} ₽ отклонена администратором.`,
    link: "/profile"
  });

  return NextResponse.json(updated);
}
