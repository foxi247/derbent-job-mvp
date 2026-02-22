import { JobPost, JobPostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pauseExpiredPublications } from "@/lib/visibility";

export type JobPostWithOwner = JobPost & {
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
  await pauseExpiredPublications();

  const where: Prisma.JobPostWhereInput = {
    status: JobPostStatus.ACTIVE,
    city: "DERBENT",
    expiresAt: { gt: new Date() },
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

  return prisma.jobPost.findMany({
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
      }
    },
    orderBy: { updatedAt: "desc" }
  });
}
