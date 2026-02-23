import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { ensureExpiringPublicationNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { notificationQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  if (session.user.role === "EXECUTOR" || session.user.role === "EMPLOYER") {
    await ensureExpiringPublicationNotifications(session.user.id, session.user.role);
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = notificationQuerySchema.safeParse(params);

  if (!parsed.success) {
    return apiValidationError(parsed.error, "Некорректные параметры");
  }

  const limit = parsed.data.limit ?? 30;
  const offset = parsed.data.offset ?? 0;

  const where = {
    userId: session.user.id,
    ...(parsed.data.unreadOnly === "true" ? { isRead: false } : {})
  };

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })
  ]);

  return jsonResponse(
    {
      notifications: rows,
      unreadCount,
      total,
      limit,
      offset
    },
    { noStore: true }
  );
}

