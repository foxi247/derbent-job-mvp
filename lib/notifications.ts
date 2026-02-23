import { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null
    }
  });
}

export async function createNotificationSafe(input: NotificationInput) {
  try {
    await createNotification(input);
  } catch {
    // Notification should not break main business flow.
  }
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}

export async function ensureExpiringPublicationNotifications(userId: string, role: UserRole) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dedupeWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const existing = await prisma.notification.findMany({
    where: {
      userId,
      type: "PUBLICATION_EXPIRING",
      createdAt: { gte: dedupeWindow }
    },
    select: { link: true }
  });
  const existingLinks = new Set(existing.map((item) => item.link).filter(Boolean) as string[]);

  if (role === "EXECUTOR") {
    const listings = await prisma.listing.findMany({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: {
          gt: now,
          lte: in24Hours
        }
      },
      select: { id: true, title: true, expiresAt: true }
    });

    const toCreate = listings
      .map((item) => {
        const link = `/listing/${item.id}`;
        if (existingLinks.has(link)) {
          return null;
        }

        return {
          userId,
          type: "PUBLICATION_EXPIRING" as NotificationType,
          title: "Срок анкеты скоро истечет",
          body: `Анкета «${item.title}» истекает ${item.expiresAt?.toLocaleDateString("ru-RU")}.`,
          link
        };
      })
      .filter(Boolean) as NotificationInput[];

    if (toCreate.length > 0) {
      await prisma.notification.createMany({
        data: toCreate.map((item) => ({
          userId: item.userId,
          type: item.type,
          title: item.title,
          body: item.body,
          link: item.link ?? null
        }))
      });
    }
  }

  if (role === "EMPLOYER") {
    const jobs = await prisma.jobPost.findMany({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: {
          gt: now,
          lte: in24Hours
        }
      },
      select: { id: true, title: true, expiresAt: true }
    });

    const toCreate = jobs
      .map((item) => {
        const link = `/jobs/${item.id}`;
        if (existingLinks.has(link)) {
          return null;
        }

        return {
          userId,
          type: "PUBLICATION_EXPIRING" as NotificationType,
          title: "Срок задания скоро истечет",
          body: `Задание «${item.title}» истекает ${item.expiresAt?.toLocaleDateString("ru-RU")}.`,
          link
        };
      })
      .filter(Boolean) as NotificationInput[];

    if (toCreate.length > 0) {
      await prisma.notification.createMany({
        data: toCreate.map((item) => ({
          userId: item.userId,
          type: item.type,
          title: item.title,
          body: item.body,
          link: item.link ?? null
        }))
      });
    }
  }
}
