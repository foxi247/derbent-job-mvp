import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { JobCard } from "@/components/jobs/job-card";
import { ListingCard } from "@/components/listing/listing-card";
import { Button } from "@/components/ui/button";
import { JobPostWithOwner } from "@/lib/jobs";
import { ListingWithProfile } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Сохраненные анкеты и задания",
  alternates: {
    canonical: `${getBaseUrl()}/favorites`
  }
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
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
        }
      },
      jobPost: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
              profile: {
                select: { phone: true }
              }
            }
          },
          tariffs: {
            where: { status: "ACTIVE", endsAt: { gt: new Date() } },
            include: { tariffPlan: { select: { kind: true } } },
            orderBy: { endsAt: "desc" },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const listingItems = favorites
    .filter((item) => Boolean(item.listing))
    .map((item) => ({
      ...(item.listing as NonNullable<typeof item.listing>),
      activeTariffKind: item.listing?.tariffs[0]?.tariffPlan.kind ?? "BASIC"
    })) as ListingWithProfile[];

  const jobItems = favorites
    .filter((item) => Boolean(item.jobPost))
    .map((item) => ({
      ...(item.jobPost as NonNullable<typeof item.jobPost>),
      activeTariffKind: item.jobPost?.tariffs[0]?.tariffPlan.kind ?? "BASIC"
    })) as JobPostWithOwner[];

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Избранное</h1>
        <p className="mt-1 text-sm text-muted-foreground">Здесь сохранены анкеты исполнителей и задания работодателей.</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Исполнители</h2>
          <span className="text-sm text-muted-foreground">{listingItems.length}</span>
        </div>
        {listingItems.length === 0 ? (
          <div className="surface p-5 text-sm text-muted-foreground">Пока нет избранных анкет.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listingItems.map((item) => (
              <ListingCard key={item.id} listing={item} isFavorite />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Задания</h2>
          <span className="text-sm text-muted-foreground">{jobItems.length}</span>
        </div>
        {jobItems.length === 0 ? (
          <div className="surface p-5 text-sm text-muted-foreground">Пока нет избранных заданий.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobItems.map((item) => (
              <JobCard key={item.id} job={item} isFavorite />
            ))}
          </div>
        )}
      </section>

      {favorites.length === 0 && (
        <Button asChild className="w-full sm:w-auto">
          <Link href="/">Перейти к поиску</Link>
        </Button>
      )}
    </div>
  );
}
