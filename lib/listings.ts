import { ListingStatus, Prisma, TariffKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expireEntities } from "@/lib/lifecycle";
import { sortByTariffKind } from "@/lib/tariffs";

export type ListingWithProfile = {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  priceType: "PER_SQM" | "PER_HOUR" | "FIXED" | "NEGOTIABLE";
  priceValue: Prisma.Decimal | null;
  district: string | null;
  city: "DERBENT";
  status: ListingStatus;
  expiresAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  activeTariffKind: TariffKind | "BASIC";
  user: {
    name: string | null;
    image: string | null;
    profile: {
      about: string;
      gender: "MALE" | "FEMALE" | null;
      age: number | null;
      workCategory: string | null;
      previousWork: string | null;
      experienceYears: number;
      skills: string[];
      availability: string;
      phone: string | null;
      isOnline: boolean;
      urgentToday: boolean;
    } | null;
  };
};

export type ListingFilters = {
  query?: string;
  category?: string;
  online?: boolean;
  urgent?: boolean;
  experienceMin?: number;
  experienceMax?: number;
  priceType?: "PER_SQM" | "PER_HOUR" | "FIXED" | "NEGOTIABLE";
  limit?: number;
  offset?: number;
};

export type ListingSearchResult = {
  items: ListingWithProfile[];
  total: number;
  limit: number;
  offset: number;
};

function buildListingsWhere(filters: Omit<ListingFilters, "limit" | "offset">): Prisma.ListingWhereInput {
  const experienceYears: Prisma.IntFilter = {};
  if (typeof filters.experienceMin === "number") {
    experienceYears.gte = filters.experienceMin;
  }
  if (typeof filters.experienceMax === "number") {
    experienceYears.lte = filters.experienceMax;
  }

  const profileWhere: Prisma.ProfileWhereInput = {
    ...(typeof filters.online === "boolean" ? { isOnline: filters.online } : {}),
    ...(typeof filters.urgent === "boolean" ? { urgentToday: filters.urgent } : {}),
    ...(Object.keys(experienceYears).length > 0 ? { experienceYears } : {})
  };

  return {
    status: ListingStatus.ACTIVE,
    city: "DERBENT",
    expiresAt: { gt: new Date() },
    user: {
      is: {
        isBanned: false
      }
    },
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.priceType ? { priceType: filters.priceType } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" } },
            { category: { contains: filters.query, mode: "insensitive" } },
            { description: { contains: filters.query, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(Object.keys(profileWhere).length > 0
      ? {
          user: {
            is: {
              isBanned: false,
              profile: {
                is: profileWhere
              }
            }
          }
        }
      : {})
  };
}

export async function getListings(filters: ListingFilters): Promise<ListingSearchResult> {
  await expireEntities();

  const where = buildListingsWhere(filters);
  const rows = await prisma.listing.findMany({
    where,
    select: {
      id: true,
      userId: true,
      title: true,
      category: true,
      description: true,
      priceType: true,
      priceValue: true,
      district: true,
      city: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          image: true,
          profile: {
            select: {
              about: true,
              gender: true,
              age: true,
              workCategory: true,
              previousWork: true,
              experienceYears: true,
              skills: true,
              availability: true,
              phone: true,
              isOnline: true,
              urgentToday: true
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
    priceType: row.priceType,
    priceValue: row.priceValue,
    district: row.district,
    city: row.city,
    status: row.status,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    activeTariffKind: row.tariffs[0]?.tariffPlan.kind ?? "BASIC",
    user: row.user
  })) as ListingWithProfile[];

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
