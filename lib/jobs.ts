import { JobPostStatus, Prisma, TariffKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expireEntities } from "@/lib/lifecycle";
import { sortByTariffKind } from "@/lib/tariffs";

export type JobPostWithOwner = {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  payType: "PER_HOUR" | "FIXED" | "NEGOTIABLE";
  payValue: Prisma.Decimal | null;
  district: string | null;
  phone: string | null;
  urgentToday: boolean;
  status: JobPostStatus;
  city: "DERBENT";
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  limit?: number;
  offset?: number;
};

export type JobSearchResult = {
  items: JobPostWithOwner[];
  total: number;
  limit: number;
  offset: number;
};

function buildJobsWhere(filters: Omit<JobPostFilters, "limit" | "offset">): Prisma.JobPostWhereInput {
  return {
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
}

export async function getJobPosts(filters: JobPostFilters): Promise<JobSearchResult> {
  await expireEntities();

  const rows = await prisma.jobPost.findMany({
    where: buildJobsWhere(filters),
    select: {
      id: true,
      userId: true,
      title: true,
      category: true,
      description: true,
      payType: true,
      payValue: true,
      district: true,
      phone: true,
      urgentToday: true,
      status: true,
      city: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
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
        select: { tariffPlan: { select: { kind: true } } },
        orderBy: { endsAt: "desc" },
        take: 1
      }
    }
  });

  const mapped = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    category: row.category,
    description: row.description,
    payType: row.payType,
    payValue: row.payValue,
    district: row.district,
    phone: row.phone,
    urgentToday: row.urgentToday,
    status: row.status,
    city: row.city,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    activeTariffKind: row.tariffs[0]?.tariffPlan.kind ?? "BASIC",
    user: row.user
  })) as JobPostWithOwner[];

  const sorted = sortByTariffKind(mapped);
  const total = sorted.length;
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, filters.limit ?? (total || 1));
  const items = sorted.slice(offset, offset + limit);

  return {
    items,
    total,
    limit,
    offset
  };
}
