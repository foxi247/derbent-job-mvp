import { JobPost, JobPostStatus, Prisma, TariffKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expireEntities } from "@/lib/lifecycle";
import { sortByTariffKind } from "@/lib/tariffs";

export type JobPostWithOwner = JobPost & {
  activeTariffKind: TariffKind | "BASIC";
  user: {
    name: string | null;
    image: string | null;
    profile: {
      phone: string | null;
    } | null;
  };
};

export type JobPostFilters = {
  query?: string;
  category?: string;
  payType?: "PER_HOUR" | "FIXED" | "NEGOTIABLE";
  urgent?: boolean;
};

export async function getJobPosts(filters: JobPostFilters): Promise<JobPostWithOwner[]> {
  await expireEntities();

  const where: Prisma.JobPostWhereInput = {
    status: JobPostStatus.ACTIVE,
    city: "DERBENT",
    expiresAt: { gt: new Date() },
    user: {
      is: {
        isBanned: false
      }
    },
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.payType ? { payType: filters.payType } : {}),
    ...(typeof filters.urgent === "boolean" ? { urgentToday: filters.urgent } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" } },
            { category: { contains: filters.query, mode: "insensitive" } },
            { description: { contains: filters.query, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const rows = await prisma.jobPost.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          image: true,
          profile: {
            select: {
              phone: true
            }
          }
        }
      },
      tariffs: {
        where: { status: "ACTIVE", endsAt: { gt: new Date() } },
        include: { tariffPlan: { select: { kind: true } } },
        orderBy: { endsAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const mapped = rows.map((row) => ({
    ...row,
    activeTariffKind: row.tariffs[0]?.tariffPlan.kind ?? "BASIC"
  })) as JobPostWithOwner[];

  return sortByTariffKind(mapped);
}
