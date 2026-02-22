import { prisma } from "@/lib/prisma";

export async function pauseExpiredPublications() {
  const now = new Date();

  await Promise.all([
    prisma.listing.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: now }
      },
      data: {
        status: "PAUSED"
      }
    }),
    prisma.jobPost.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: now }
      },
      data: {
        status: "PAUSED"
      }
    })
  ]);
}
