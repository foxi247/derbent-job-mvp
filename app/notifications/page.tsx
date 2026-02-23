import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MarkAllReadButton } from "@/components/forms/mark-all-read-button";
import { ensureExpiringPublicationNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Уведомления",
  description: "События по откликам, пополнениям и срокам публикаций",
  alternates: {
    canonical: `${getBaseUrl()}/notifications`
  }
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role === "EXECUTOR" || session.user.role === "EMPLOYER") {
    await ensureExpiringPublicationNotifications(session.user.id, session.user.role);
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 120
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Уведомления</h1>
            <p className="mt-1 text-sm text-muted-foreground">Непрочитанных: {unreadCount}</p>
          </div>
          <MarkAllReadButton />
        </div>
      </section>

      <section className="space-y-2">
        {notifications.length === 0 ? (
          <div className="surface p-5 text-sm text-muted-foreground">Уведомлений пока нет.</div>
        ) : (
          notifications.map((item) => (
            <article key={item.id} className="surface p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                {!item.isRead && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
              {item.link && (
                <div className="mt-2">
                  <Link href={item.link} className="text-xs font-medium text-primary hover:underline">
                    Перейти
                  </Link>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
