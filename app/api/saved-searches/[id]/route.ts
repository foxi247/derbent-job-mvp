import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(_: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const item = await prisma.savedSearch.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true }
  });

  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Сохраненный поиск не найден" }, { status: 404 });
  }

  await prisma.savedSearch.delete({
    where: { id: item.id }
  });

  return NextResponse.json({ ok: true });
}
