import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PRICE_TYPE_LABELS } from "@/lib/constants";
import { maskPhone } from "@/lib/phone";
import { Badge } from "@/components/ui/badge";
import { MessageForm } from "@/components/forms/message-form";
import { ContactReveal } from "@/components/forms/contact-reveal";

type ListingPageProps = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function ListingPage({ params, searchParams }: ListingPageProps) {
  const pageValue = typeof searchParams.page === "string" ? Number(searchParams.page) : 1;
  const currentPage = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
  const take = 10;
  const skip = (currentPage - 1) * take;

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: true
        }
      }
    }
  });

  if (!listing) {
    notFound();
  }

  const profile = listing.user.profile;
  const contactPhone = profile?.phone ?? null;

  const [ratingStats, reviews] = await Promise.all([
    prisma.review.aggregate({
      where: { executorUserId: listing.userId },
      _avg: { rating: true },
      _count: { _all: true }
    }),
    prisma.review.findMany({
      where: { executorUserId: listing.userId },
      include: {
        employer: {
          select: {
            name: true
          }
        },
        jobPost: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    })
  ]);

  const totalReviews = ratingStats._count._all;
  const averageRating = ratingStats._avg.rating;
  const totalPages = Math.max(1, Math.ceil(totalReviews / take));

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <article className="surface space-y-4 p-5 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{listing.title}</h1>
          <p className="text-sm text-muted-foreground">
            {listing.category} • Дербент{listing.district ? `, ${listing.district}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile?.isOnline && <Badge className="bg-emerald-100 text-emerald-700">В сети</Badge>}
          {profile?.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно / сегодня</Badge>}
          <Badge>{profile?.experienceYears ?? 0} лет стажа</Badge>
          <Badge>
            {listing.priceType === "NEGOTIABLE"
              ? "Цена договорная"
              : `${listing.priceValue != null ? String(listing.priceValue) : "-"} RUB ${PRICE_TYPE_LABELS[listing.priceType]}`}
          </Badge>
        </div>

        <p className="text-sm leading-6">{listing.description}</p>

        <div className="rounded-xl bg-secondary/50 p-4 text-sm">
          <h2 className="mb-2 font-medium">Профиль исполнителя</h2>
          <p>
            <span className="text-muted-foreground">Имя:</span> {listing.user.name ?? "Не указано"}
          </p>
          <p>
            <span className="text-muted-foreground">О себе:</span> {profile?.about || "Без описания"}
          </p>
          <p>
            <span className="text-muted-foreground">Навыки:</span> {(profile?.skills ?? []).join(", ") || "Не указаны"}
          </p>
          <p>
            <span className="text-muted-foreground">Доступность:</span> {profile?.availability || "По договоренности"}
          </p>

          <div className="mt-3">
            <ContactReveal listingId={listing.id} hasPhone={Boolean(contactPhone)} maskedPhone={maskPhone(contactPhone)} />
          </div>
        </div>

        <section className="space-y-3 rounded-xl border bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Отзывы об исполнителе</h2>
            <p className="text-sm text-muted-foreground">
              {averageRating ? averageRating.toFixed(1) : "0.0"} / 5 • {totalReviews}
            </p>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет отзывов.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border bg-background/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{review.rating}/5 • {review.employer.name ?? "Работодатель"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Задание: {review.jobPost.title}</p>
                  {review.text && <p className="mt-2 text-sm">{review.text}</p>}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <Link
                className={`rounded-md border px-2 py-1 ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                href={`/listing/${listing.id}?page=${currentPage - 1}`}
              >
                Назад
              </Link>
              <span className="text-muted-foreground">Страница {currentPage} из {totalPages}</span>
              <Link
                className={`rounded-md border px-2 py-1 ${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                href={`/listing/${listing.id}?page=${currentPage + 1}`}
              >
                Вперед
              </Link>
            </div>
          )}
        </section>
      </article>

      <aside>
        <MessageForm listingId={listing.id} title="Написать исполнителю" />
      </aside>
    </div>
  );
}
