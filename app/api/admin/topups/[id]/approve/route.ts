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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({ where: { id: context.params.id } });

      if (!request) {
        throw new Error("TOPUP_NOT_FOUND");
      }

      if (request.status !== "PENDING") {
        throw new Error("TOPUP_NOT_PENDING");
      }

      if (request.expiresAt <= new Date()) {
        await tx.topUpRequest.update({
          where: { id: request.id },
          data: { status: "EXPIRED" }
        });
        throw new Error("TOPUP_EXPIRED");
      }

      await tx.user.update({
        where: { id: request.userId },
        data: {
          balanceRub: { increment: request.amountRub }
        }
      });

      return tx.topUpRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          approverUserId: authResult.session.user.id,
          adminNote: parsed.data.adminNote ?? null
        }
      });
    });

    await createNotificationSafe({
      userId: result.userId,
      type: "TOPUP_APPROVED",
      title: "Пополнение подтверждено",
      body: `Заявка на ${result.amountRub} ₽ подтверждена администратором.`,
      link: "/profile"
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "TOPUP_NOT_FOUND") {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (message === "TOPUP_NOT_PENDING") {
      return NextResponse.json({ error: "Можно подтверждать только заявки в ожидании" }, { status: 400 });
    }

    if (message === "TOPUP_EXPIRED") {
      return NextResponse.json({ error: "Срок заявки истек" }, { status: 400 });
    }

    throw error;
  }
}
