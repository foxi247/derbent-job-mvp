import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
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

  const updated = await prisma.topUpRequest.update({
    where: { id: topUpRequest.id },
    data: {
      status: topUpRequest.expiresAt <= new Date() ? "EXPIRED" : "REJECTED",
      approverUserId: authResult.session.user.id,
      adminNote: parsed.data.adminNote ?? null
    }
  });

  return NextResponse.json(updated);
}
