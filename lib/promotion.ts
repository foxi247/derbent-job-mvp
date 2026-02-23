import { prisma } from "@/lib/prisma";
import { publishJobByTariff, publishListingByTariff } from "@/lib/tariffs";

export function getPromotionEnd(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function getOrCreateDemoPlan() {
  const existing = await prisma.paymentPlan.findFirst({
    where: {
      durationDays: 7,
      priceRub: 200,
      isActive: true
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.paymentPlan.create({
    data: {
      name: "7 дней / 200₽",
      durationDays: 7,
      priceRub: 200,
      isActive: true
    }
  });
}

async function resolveFallbackTariffId() {
  const tariff = await prisma.tariffPlan.findFirst({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceRub: "asc" }]
  });

  if (!tariff) {
    throw new Error("TARIFF_NOT_FOUND");
  }

  return tariff.id;
}

export async function createListingPromotion(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true }
  });

  if (!listing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  const tariffPlanId = await resolveFallbackTariffId();
  return publishListingByTariff({ listingId: listing.id, userId: listing.userId, tariffPlanId });
}

export async function createJobPostPromotion(jobPostId: string) {
  const jobPost = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: { id: true, userId: true }
  });

  if (!jobPost) {
    throw new Error("JOB_POST_NOT_FOUND");
  }

  const tariffPlanId = await resolveFallbackTariffId();
  return publishJobByTariff({ jobPostId: jobPost.id, userId: jobPost.userId, tariffPlanId });
}
