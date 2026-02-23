import { auth } from "@/auth";
import { apiError, jsonResponse } from "@/lib/api-response";
import { assertNotBanned } from "@/lib/access";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return apiError("Аккаунт заблокирован", 403, { code: "USER_BANNED" });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    select: { id: true, userId: true, status: true }
  });

  if (!job) {
    return apiError("Задание не найдено", 404, { code: "NOT_FOUND" });
  }

  if (job.userId !== session.user.id) {
    return apiError("Можно завершать только свои задания", 403, { code: "FORBIDDEN" });
  }

  if (job.status === "COMPLETED") {
    return jsonResponse({ ok: true, status: job.status }, { noStore: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.jobPost.update({
      where: { id: job.id },
      data: { status: "COMPLETED" }
    });

    await tx.jobApplication.updateMany({
      where: { jobPostId: job.id, status: "ACCEPTED" },
      data: { status: "COMPLETED" }
    });
  });

  return jsonResponse({ ok: true, status: "COMPLETED" }, { noStore: true });
}

