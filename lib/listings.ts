import { Listing, ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pauseExpiredPublications } from "@/lib/visibility";

export type ListingWithProfile = Listing & {
  user: {
    name: string | null;
    image: string | null;
    profile: {
      about: string;
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
  await pauseExpiredPublications();

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
              profile: {
                is: profileWhere
              }
            }
          }
        }
      : {})
  };

  return prisma.listing.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          image: true,
          profile: {
            select: {
              about: true,
              experienceYears: true,
              skills: true,
              availability: true,
              phone: true,
              isOnline: true,
              urgentToday: true
            }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
}

