import { Listing, ListingStatus, Prisma, TariffKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expireEntities } from "@/lib/lifecycle";
import { sortByTariffKind } from "@/lib/tariffs";

export type ListingWithProfile = Listing & {
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
};

export async function getListings(filters: ListingFilters): Promise<ListingWithProfile[]> {
  await expireEntities();

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

  const where: Prisma.ListingWhereInput = {
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

  const rows = await prisma.listing.findMany({
    where,
    include: {
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
  })) as ListingWithProfile[];

  return sortByTariffKind(mapped);
}
