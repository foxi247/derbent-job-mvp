import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/jobs`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.5 }
  ];

  try {
    const [listings, jobs] = await Promise.all([
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: now }
        },
        select: {
          id: true,
          updatedAt: true
        },
        take: 5000
      }),
      prisma.jobPost.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: now }
        },
        select: {
          id: true,
          updatedAt: true
        },
        take: 5000
      })
    ]);

    return [
      ...staticPages,
      ...listings.map((item) => ({
        url: `${baseUrl}/listing/${item.id}`,
        lastModified: item.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8
      })),
      ...jobs.map((item) => ({
        url: `${baseUrl}/jobs/${item.id}`,
        lastModified: item.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8
      }))
    ];
  } catch {
    return staticPages;
  }
}
