import { prisma } from "@/lib/prisma";
import { DEMO_PLAN_DAYS, DEMO_PLAN_PRICE_RUB } from "@/lib/constants";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getPromotionEnd(days = DEMO_PLAN_DAYS) {
  return new Date(Date.now() + days * DAY_IN_MS);
}

export async function getOrCreateDemoPlan() {
  const existing = await prisma.paymentPlan.findFirst({
    where: {
      durationDays: DEMO_PLAN_DAYS,
      priceRub: DEMO_PLAN_PRICE_RUB,
      isActive: true
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.paymentPlan.create({
    data: {
      name: "7 дней / 200₽",
      durationDays: DEMO_PLAN_DAYS,
      priceRub: DEMO_PLAN_PRICE_RUB,
      isActive: true
    }
  });
}

export async function createListingPromotion(listingId: string) {
  const plan = await getOrCreateDemoPlan();
  const endsAt = getPromotionEnd(plan.durationDays);

  return prisma.$transaction(async (tx) => {
    await tx.listingPromotion.create({
      data: {
        listingId,
        paymentPlanId: plan.id,
        endsAt,
        isDemo: true
      }
    });

    return tx.listing.update({
      where: { id: listingId },
      data: {
        status: "ACTIVE",
        expiresAt: endsAt
      }
    });
  });
}

export async function createJobPostPromotion(jobPostId: string) {
  const plan = await getOrCreateDemoPlan();
  const endsAt = getPromotionEnd(plan.durationDays);

  return prisma.$transaction(async (tx) => {
    await tx.listingPromotion.create({
      data: {
        jobPostId,
        paymentPlanId: plan.id,
        endsAt,
        isDemo: true
      }
    });

    return tx.jobPost.update({
      where: { id: jobPostId },
      data: {
        status: "ACTIVE",
        expiresAt: endsAt
      }
    });
  });
}
