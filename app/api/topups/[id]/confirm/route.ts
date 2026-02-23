import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { topUpConfirmSchema } from "@/lib/validations";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = topUpConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const topUpRequest = await prisma.topUpRequest.findUnique({
    where: { id: context.params.id }
  });

  if (!topUpRequest || topUpRequest.userId !== session.user.id) {
    return apiError("Заявка не найдена", 404, { code: "NOT_FOUND" });
  }

  if (topUpRequest.status !== "PENDING") {
    return apiError("Подтверждение доступно только для заявок в ожидании", 400, { code: "INVALID_STATUS" });
  }

  if (topUpRequest.expiresAt <= new Date()) {
    const expired = await prisma.topUpRequest.update({
      where: { id: topUpRequest.id },
      data: { status: "EXPIRED" }
    });

    return jsonResponse(
      {
        error: "Время оплаты истекло",
        code: "TOPUP_EXPIRED",
        request: expired
      },
      { status: 400, noStore: true }
    );
  }

  const updated = await prisma.topUpRequest.update({
    where: { id: topUpRequest.id },
    data: {
      proofText: parsed.data.proofText ?? null
    }
  });

  return jsonResponse(updated, { noStore: true });
}

