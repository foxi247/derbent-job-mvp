import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { MessageForm } from "@/components/forms/message-form";

const PRICE_LABELS = {
  PER_SQM: "за м2",
  PER_HOUR: "за час",
  FIXED: "фиксированная",
  NEGOTIABLE: "договорная"
};

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
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
              : `${listing.priceValue ? String(listing.priceValue) : "-"} RUB ${PRICE_LABELS[listing.priceType]}`}
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
        </div>
      </article>

      <aside>
        <MessageForm listingId={listing.id} />
      </aside>
    </div>
  );
}