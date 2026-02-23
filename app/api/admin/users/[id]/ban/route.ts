import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { banUserSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const body = await req.json();
  const parsed = banUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (context.params.id === authResult.session.user.id && parsed.data.isBanned) {
    return NextResponse.json({ error: "Нельзя заблокировать самого себя" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: context.params.id },
    data: {
      isBanned: parsed.data.isBanned,
      bannedAt: parsed.data.isBanned ? new Date() : null
    },
    select: {
      id: true,
      isBanned: true,
      bannedAt: true
    }
  });

  return NextResponse.json(user);
}
