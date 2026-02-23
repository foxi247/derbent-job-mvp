import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { FavoriteToggle } from "@/components/common/favorite-toggle";
import { ContactReveal } from "@/components/forms/contact-reveal";
import { MessageForm } from "@/components/forms/message-form";
import { ReportMenu } from "@/components/forms/report-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRICE_TYPE_LABELS } from "@/lib/constants";
import { maskPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

type ListingPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, description: true, category: true }
  });

  if (!listing) {
    return {
      title: "Анкета не найдена",
      alternates: { canonical: `${getBaseUrl()}/listing/${params.id}` }
    };
  }

  const title = `${listing.title} - ${listing.category} в Дербенте`;
  const description = listing.description.slice(0, 180);
  const canonical = `${getBaseUrl()}/listing/${listing.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      locale: "ru_RU"
    }
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const session = await auth();

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              about: true,
              experienceYears: true,
              skills: true,
              availability: true,
              workCategory: true,
              previousWork: true,
              phone: true,
              isOnline: true,
              urgentToday: true
            }
          }
        }
      }
    }
  });

  if (!listing) {
    notFound();
  }

  const [reviewStats, reviews, favorite] = await Promise.all([
    prisma.review.aggregate({
      where: { executorUserId: listing.userId },
      _avg: { rating: true },
      _count: { rating: true }
    }),
    prisma.review.findMany({
      where: { executorUserId: listing.userId },
      include: {
        employer: { select: { name: true } },
        jobPost: { select: { title: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    session?.user
      ? prisma.favorite.findUnique({
          where: {
            userId_listingId: {
              userId: session.user.id,
              listingId: listing.id
            }
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  const profile = listing.user.profile;
  const averageRating = reviewStats._avg.rating ? Number(reviewStats._avg.rating).toFixed(1) : null;
  const reviewCount = reviewStats._count.rating;
  const maskedPhone = maskPhone(profile?.phone);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">Назад к исполнителям</Link>
        </Button>
        <div className="flex items-center gap-1">
          <FavoriteToggle targetType="LISTING" listingId={listing.id} initialActive={Boolean(favorite)} />
          {session?.user && <ReportMenu targetType="LISTING" listingId={listing.id} />}
        </div>
      </div>

      <section className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{listing.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {listing.category} • {listing.user.name ?? "Исполнитель"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">
              {listing.priceType === "NEGOTIABLE" ? "Договорная" : `${listing.priceValue ?? "-"} ₽`}
            </p>
            <p className="text-sm text-muted-foreground">{PRICE_TYPE_LABELS[listing.priceType]}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{listing.description}</p>

        <div className="flex flex-wrap gap-2">
          {profile?.isOnline && <Badge className="bg-emerald-100 text-emerald-700">В сети</Badge>}
          {profile?.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно ищу работу</Badge>}
          <Badge>Стаж: {profile?.experienceYears ?? 0} лет</Badge>
          <Badge>{listing.district ? `Район: ${listing.district}` : "Дербент"}</Badge>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface space-y-3 p-5">
          <h2 className="text-lg font-semibold">Профиль исполнителя</h2>
          <p className="text-sm text-muted-foreground">{profile?.about || "Описание не заполнено."}</p>

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Категория:</span> {profile?.workCategory || listing.category}
            </p>
            <p>
              <span className="text-muted-foreground">Где работал:</span> {profile?.previousWork || "Не указано"}
            </p>
            <p>
              <span className="text-muted-foreground">Доступность:</span> {profile?.availability || "По договоренности"}
            </p>
            <p>
              <span className="text-muted-foreground">Навыки:</span>{" "}
              {profile?.skills?.length ? profile.skills.join(", ") : "Не указаны"}
            </p>
          </div>

          <ContactReveal maskedPhone={maskedPhone} listingId={listing.id} hasPhone={Boolean(profile?.phone)} />
        </article>

        <MessageForm listingId={listing.id} title="Написать исполнителю" />
      </section>

      <section className="surface space-y-3 p-5">
        <h2 className="text-lg font-semibold">Рейтинг и отзывы</h2>
        <p className="text-sm text-muted-foreground">
          {averageRating ? `${averageRating} / 5` : "Пока без оценок"} • отзывов: {reviewCount}
        </p>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет отзывов.</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border bg-background/70 p-3 text-sm">
                <p className="font-medium">
                  {review.rating}/5 • {review.employer.name ?? "Работодатель"}
                </p>
                {review.text && <p className="mt-1 text-muted-foreground">{review.text}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {review.jobPost.title} • {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
