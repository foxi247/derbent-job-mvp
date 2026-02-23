import { TariffKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TARIFF_KIND_SORT_PRIORITY } from "@/lib/constants";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type ActiveTariffKind = TariffKind | "BASIC";

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

export async function publishListingByTariff(params: { listingId: string; userId: string; tariffPlanId: string }) {
  const { tariff, priceToPay } = await resolveTariffForPublication(params.tariffPlanId);
  const endsAt = getTariffEnd(tariff.durationDays);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: { balanceRub: true, isBanned: true }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.isBanned) {
      throw new Error("USER_BANNED");
    }
    if (user.balanceRub < priceToPay) {
      throw new Error("NOT_ENOUGH_BALANCE");
    }

    await tx.user.update({
      where: { id: params.userId },
      data: { balanceRub: { decrement: priceToPay } }
    });

    await tx.listingTariff.updateMany({
      where: { listingId: params.listingId, status: "ACTIVE" },
      data: { status: "EXPIRED" }
    });

    await tx.listingTariff.create({
      data: {
        listingId: params.listingId,
        tariffPlanId: tariff.id,
        startsAt: new Date(),
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
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: { balanceRub: true, isBanned: true }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.isBanned) {
      throw new Error("USER_BANNED");
    }
    if (user.balanceRub < priceToPay) {
      throw new Error("NOT_ENOUGH_BALANCE");
    }

    await tx.user.update({
      where: { id: params.userId },
      data: { balanceRub: { decrement: priceToPay } }
    });

    await tx.listingTariff.updateMany({
      where: { jobPostId: params.jobPostId, status: "ACTIVE" },
      data: { status: "EXPIRED" }
    });

    await tx.listingTariff.create({
      data: {
        jobPostId: params.jobPostId,
        tariffPlanId: tariff.id,
        startsAt: new Date(),
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
