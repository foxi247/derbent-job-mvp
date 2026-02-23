import { Prisma, TariffKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TARIFF_KIND_SORT_PRIORITY } from "@/lib/constants";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PUBLICATION_IDEMPOTENCY_WINDOW_MS = 15 * 1000;

export type ActiveTariffKind = TariffKind | "BASIC";

type LockedPublicationRow = {
  id: string;
  userId: string;
};

export function getEffectiveTariffPrice(priceRub: number, discountPercent: number) {
  return Math.max(0, Math.floor((priceRub * (100 - discountPercent)) / 100));
}

export async function getActiveTariffPlans() {
  return prisma.tariffPlan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceRub: "asc" }]
  });
}

export function sortByTariffKind<T extends { activeTariffKind: ActiveTariffKind; updatedAt: Date }>(items: T[]) {
  return items.sort((a, b) => {
    const priorityDiff = TARIFF_KIND_SORT_PRIORITY[a.activeTariffKind] - TARIFF_KIND_SORT_PRIORITY[b.activeTariffKind];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

async function resolveTariffForPublication(tariffPlanId: string) {
  const tariff = await prisma.tariffPlan.findUnique({ where: { id: tariffPlanId } });
  if (!tariff || !tariff.isActive) {
    throw new Error("TARIFF_NOT_FOUND");
  }

  const priceToPay = getEffectiveTariffPrice(tariff.priceRub, tariff.discountPercent);
  return { tariff, priceToPay };
}

function getTariffEnd(durationDays: number) {
  return new Date(Date.now() + durationDays * DAY_IN_MS);
}

async function lockListingRow(tx: Prisma.TransactionClient, listingId: string): Promise<LockedPublicationRow> {
  const rows = await tx.$queryRaw<Array<{ id: string; userId: string }>>(Prisma.sql`
    SELECT id, "userId"
    FROM "Listing"
    WHERE id = ${listingId}
    FOR UPDATE
  `);

  const row = rows[0];
  if (!row) {
    throw new Error("LISTING_NOT_FOUND");
  }

  return row;
}

async function lockJobRow(tx: Prisma.TransactionClient, jobPostId: string): Promise<LockedPublicationRow> {
  const rows = await tx.$queryRaw<Array<{ id: string; userId: string }>>(Prisma.sql`
    SELECT id, "userId"
    FROM "JobPost"
    WHERE id = ${jobPostId}
    FOR UPDATE
  `);

  const row = rows[0];
  if (!row) {
    throw new Error("JOB_NOT_FOUND");
  }

  return row;
}

async function debitUserBalance(tx: Prisma.TransactionClient, userId: string, amountRub: number) {
  const now = new Date();
  const debitedCount = await tx.$executeRaw<number>(Prisma.sql`
    UPDATE "User"
    SET "balanceRub" = "balanceRub" - ${amountRub}
    WHERE id = ${userId}
      AND "isBanned" = false
      AND "balanceRub" >= ${amountRub}
  `);

  if (debitedCount === 1) {
    return;
  }

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, isBanned: true, balanceRub: true, createdAt: true }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  if (user.isBanned) {
    throw new Error("USER_BANNED");
  }

  if (user.balanceRub < amountRub) {
    throw new Error("NOT_ENOUGH_BALANCE");
  }

  if (user.createdAt > now) {
    throw new Error("USER_NOT_FOUND");
  }

  throw new Error("PUBLICATION_DEBIT_FAILED");
}

function isRecentPublication(startsAt: Date, now: Date) {
  return startsAt.getTime() >= now.getTime() - PUBLICATION_IDEMPOTENCY_WINDOW_MS;
}

export async function publishListingByTariff(params: { listingId: string; userId: string; tariffPlanId: string }) {
  const { tariff, priceToPay } = await resolveTariffForPublication(params.tariffPlanId);
  const endsAt = getTariffEnd(tariff.durationDays);

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const listing = await lockListingRow(tx, params.listingId);

    if (listing.userId !== params.userId) {
      throw new Error("FORBIDDEN");
    }

    const activeTariff = await tx.listingTariff.findFirst({
      where: {
        listingId: params.listingId,
        status: "ACTIVE",
        endsAt: { gt: now }
      },
      orderBy: { startsAt: "desc" },
      select: { id: true, tariffPlanId: true, startsAt: true, endsAt: true }
    });

    if (activeTariff && activeTariff.tariffPlanId === params.tariffPlanId && isRecentPublication(activeTariff.startsAt, now)) {
      return tx.listing.update({
        where: { id: params.listingId },
        data: {
          status: "ACTIVE",
          expiresAt: activeTariff.endsAt
        }
      });
    }

    await debitUserBalance(tx, params.userId, priceToPay);

    await tx.listingTariff.updateMany({
      where: { listingId: params.listingId, status: "ACTIVE" },
      data: { status: "EXPIRED" }
    });

    await tx.listingTariff.create({
      data: {
        listingId: params.listingId,
        tariffPlanId: tariff.id,
        startsAt: now,
        endsAt,
        status: "ACTIVE"
      }
    });

    return tx.listing.update({
      where: { id: params.listingId },
      data: {
        status: "ACTIVE",
        expiresAt: endsAt
      }
    });
  });
}

export async function publishJobByTariff(params: { jobPostId: string; userId: string; tariffPlanId: string }) {
  const { tariff, priceToPay } = await resolveTariffForPublication(params.tariffPlanId);
  const endsAt = getTariffEnd(tariff.durationDays);

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const jobPost = await lockJobRow(tx, params.jobPostId);

    if (jobPost.userId !== params.userId) {
      throw new Error("FORBIDDEN");
    }

    const activeTariff = await tx.listingTariff.findFirst({
      where: {
        jobPostId: params.jobPostId,
        status: "ACTIVE",
        endsAt: { gt: now }
      },
      orderBy: { startsAt: "desc" },
      select: { id: true, tariffPlanId: true, startsAt: true, endsAt: true }
    });

    if (activeTariff && activeTariff.tariffPlanId === params.tariffPlanId && isRecentPublication(activeTariff.startsAt, now)) {
      return tx.jobPost.update({
        where: { id: params.jobPostId },
        data: {
          status: "ACTIVE",
          expiresAt: activeTariff.endsAt
        }
      });
    }

    await debitUserBalance(tx, params.userId, priceToPay);

    await tx.listingTariff.updateMany({
      where: { jobPostId: params.jobPostId, status: "ACTIVE" },
      data: { status: "EXPIRED" }
    });

    await tx.listingTariff.create({
      data: {
        jobPostId: params.jobPostId,
        tariffPlanId: tariff.id,
        startsAt: now,
        endsAt,
        status: "ACTIVE"
      }
    });

    return tx.jobPost.update({
      where: { id: params.jobPostId },
      data: {
        status: "ACTIVE",
        expiresAt: endsAt
      }
    });
  });
}

