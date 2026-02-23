import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
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
    return apiValidationError(parsed.error);
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({
        where: { id: context.params.id },
        select: {
          id: true,
          userId: true,
          amountRub: true,
          status: true,
          expiresAt: true
        }
      });

      if (!request) {
        throw new Error("TOPUP_NOT_FOUND");
      }

      if (request.status !== "PENDING") {
        throw new Error("TOPUP_ALREADY_PROCESSED");
      }

      const nextStatus = request.expiresAt <= now ? "EXPIRED" : "REJECTED";

      const updatedCount = await tx.topUpRequest.updateMany({
        where: {
          id: request.id,
          status: "PENDING"
        },
        data: {
          status: nextStatus,
          approverUserId: authResult.session.user.id,
          adminNote: parsed.data.adminNote ?? null
        }
      });

      if (updatedCount.count !== 1) {
        throw new Error("TOPUP_ALREADY_PROCESSED");
      }

      const updated = await tx.topUpRequest.findUnique({
        where: { id: request.id }
      });

      if (!updated) {
        throw new Error("TOPUP_NOT_FOUND");
      }

      return updated;
    });

    await createNotificationSafe({
      userId: result.userId,
      type: "TOPUP_REJECTED",
      title: result.status === "EXPIRED" ? "Заявка на пополнение истекла" : "Пополнение отклонено",
      body:
        result.status === "EXPIRED"
          ? `Заявка на ${result.amountRub} ₽ истекла по времени.`
          : `Заявка на ${result.amountRub} ₽ отклонена администратором.`,
      link: "/profile"
    });

    return jsonResponse(result, { noStore: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "TOPUP_NOT_FOUND") {
      return apiError("Заявка не найдена", 404, { code: "TOPUP_NOT_FOUND" });
    }

    if (message === "TOPUP_ALREADY_PROCESSED") {
      return apiError("Заявка уже обработана", 409, { code: "TOPUP_ALREADY_PROCESSED" });
    }

    return apiError("Не удалось отклонить пополнение", 500, { code: "TOPUP_REJECT_FAILED" });
  }
}

