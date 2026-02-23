import Link from "next/link";
import { ListingWithProfile } from "@/lib/listings";
import {
  PRICE_TYPE_LABELS,
  TARIFF_KIND_BADGE_STYLES,
  TARIFF_KIND_CARD_STYLES,
  TARIFF_KIND_LABELS
} from "@/lib/constants";
import { FavoriteToggle } from "@/components/common/favorite-toggle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function ListingCard({
  listing,
  isFavorite = false
}: {
  listing: ListingWithProfile;
  isFavorite?: boolean;
}) {
  const profile = listing.user.profile;
  const workerName = listing.user.name?.trim() || "Исполнитель";
  const avatarLetter = workerName[0]?.toUpperCase() ?? "И";

  return (
    <Card
      className={`group surface flex h-full flex-col space-y-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        TARIFF_KIND_CARD_STYLES[listing.activeTariffKind]
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary font-semibold text-foreground">
            {avatarLetter}
          </span>
          <span className="truncate">{workerName}</span>
        </div>
        <div className="flex items-center gap-1">
          <FavoriteToggle targetType="LISTING" listingId={listing.id} initialActive={isFavorite} />
          <Badge className={TARIFF_KIND_BADGE_STYLES[listing.activeTariffKind]}>
            {TARIFF_KIND_LABELS[listing.activeTariffKind]}
          </Badge>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/listing/${listing.id}`} className="font-semibold leading-5 hover:text-primary hover:underline">
            {listing.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">{listing.category}</p>
        </div>

        <div className="text-right text-sm">
          <div className="font-medium">
            {listing.priceType === "NEGOTIABLE" ? "Договорная" : `${listing.priceValue ?? "-"} RUB`}
          </div>
          <div className="text-xs text-muted-foreground">{PRICE_TYPE_LABELS[listing.priceType]}</div>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>

      <div className="mt-auto flex flex-wrap gap-2">
        {profile?.isOnline && <Badge className="bg-emerald-100 text-emerald-700">В сети</Badge>}
        {profile?.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно</Badge>}
        <Badge>{profile?.experienceYears ?? 0} лет стажа</Badge>
      </div>

      <div className="text-xs text-muted-foreground">{listing.district ? `Район: ${listing.district}` : "Дербент"}</div>
    </Card>
  );
}
