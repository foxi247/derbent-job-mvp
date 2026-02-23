import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureExpiringPublicationNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { notificationQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (session.user.role === "EXECUTOR" || session.user.role === "EMPLOYER") {
    await ensureExpiringPublicationNotifications(session.user.id, session.user.role);
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = notificationQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const where = {
    userId: session.user.id,
    ...(parsed.data.unreadOnly === "true" ? { isRead: false } : {})
  };

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })
  ]);

  return NextResponse.json({
    notifications: rows,
    unreadCount
  });
}
