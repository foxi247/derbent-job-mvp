import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const jobPost = await prisma.jobPost.findUnique({ where: { id: context.params.id } });
  if (!jobPost) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  if (jobPost.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const updated = await prisma.jobPost.update({
    where: { id: context.params.id },
    data: {
      status: "COMPLETED"
    }
  });

  return NextResponse.json(updated);
}
