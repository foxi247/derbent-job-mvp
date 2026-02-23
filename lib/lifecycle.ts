import { prisma } from "@/lib/prisma";

export async function expireEntities() {
  const now = new Date();
  const tasks: Promise<unknown>[] = [];

  if (typeof prisma.topUpRequest?.updateMany === "function") {
    tasks.push(
      prisma.topUpRequest.updateMany({
        where: {
          status: "PENDING",
          expiresAt: { lte: now }
        },
        data: {
          status: "EXPIRED"
        }
      })
    );
  }

  if (typeof prisma.listingTariff?.updateMany === "function") {
    tasks.push(
      prisma.listingTariff.updateMany({
        where: {
          status: "ACTIVE",
          endsAt: { lte: now }
        },
        data: {
          status: "EXPIRED"
        }
      })
    );
  }

  if (typeof prisma.listing?.updateMany === "function") {
    tasks.push(
      prisma.listing.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: { lte: now }
        },
        data: {
          status: "PAUSED"
        }
      })
    );
  }

  if (typeof prisma.jobPost?.updateMany === "function") {
    tasks.push(
      prisma.jobPost.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: { lte: now }
        },
        data: {
          status: "PAUSED"
        }
      })
    );
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

