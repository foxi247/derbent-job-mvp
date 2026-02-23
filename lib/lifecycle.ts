import { prisma } from "@/lib/prisma";

export async function expireEntities() {
  const now = new Date();
  const client = prisma as any;
  const tasks: Promise<unknown>[] = [];

  if (client.topUpRequest?.updateMany) {
    tasks.push(
      client.topUpRequest.updateMany({
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

  if (client.listingTariff?.updateMany) {
    tasks.push(
      client.listingTariff.updateMany({
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

  if (client.listing?.updateMany) {
    tasks.push(
      client.listing.updateMany({
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

  if (client.jobPost?.updateMany) {
    tasks.push(
      client.jobPost.updateMany({
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
