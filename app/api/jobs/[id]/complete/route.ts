import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/access";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true, status: true }
  });

  if (!job) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: "Можно завершать только свои задания" }, { status: 403 });
  }

  if (job.status === "COMPLETED") {
    return NextResponse.json({ ok: true, status: job.status });
  }

  await prisma.jobPost.update({
    where: { id: job.id },
    data: { status: "COMPLETED" }
  });

  return NextResponse.json({ ok: true, status: "COMPLETED" });
}
