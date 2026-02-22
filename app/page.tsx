import Link from "next/link";
import { getListings } from "@/lib/listings";
import { CATEGORIES, CITY_LABEL } from "@/lib/constants";
import { ListingCard } from "@/components/listing/listing-card";
import { SearchFilters } from "@/components/forms/search-filters";
import { Button } from "@/components/ui/button";

type HomeProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const query = typeof searchParams.query === "string" ? searchParams.query : undefined;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const priceType = typeof searchParams.priceType === "string" ? (searchParams.priceType as any) : undefined;
  const online = searchParams.online === "true" ? true : searchParams.online === "false" ? false : undefined;
  const urgent = searchParams.urgent === "true" ? true : searchParams.urgent === "false" ? false : undefined;
  const experienceMin = typeof searchParams.experienceMin === "string" ? Number(searchParams.experienceMin) : undefined;
  const experienceMax = typeof searchParams.experienceMax === "string" ? Number(searchParams.experienceMax) : undefined;

  let dbUnavailable = false;
  let listings: Awaited<ReturnType<typeof getListings>> = [];

  try {
    listings = await getListings({
      query,
      category,
      priceType,
      online,
      urgent,
      experienceMin,
      experienceMax
    });
  } catch (error) {
    dbUnavailable = true;
    console.error("Failed to fetch listings", error);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="surface overflow-hidden p-5 md:p-7">
        <div className="grid gap-5 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Площадка исполнителей
            </p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Работа и подработка в {CITY_LABEL}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Ищите работников на смену или разовую задачу. Исполнители публикуют карточки с ценой, стажем, доступностью и статусом онлайн.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/auth/signin">Разместить услугу</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="#listings">Смотреть исполнителей</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary/70 p-3 text-center">
            <div>
              <div className="text-lg font-semibold">{listings.length}</div>
              <div className="text-xs text-muted-foreground">Карточек</div>
            </div>
            <div>
              <div className="text-lg font-semibold">24/7</div>
              <div className="text-xs text-muted-foreground">Поиск</div>
            </div>
            <div>
              <div className="text-lg font-semibold">1 город</div>
              <div className="text-xs text-muted-foreground">MVP</div>
            </div>
          </div>
        </div>
      </section>

      <SearchFilters categories={[...CATEGORIES]} />

      {dbUnavailable && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          База данных временно недоступна. Обновите страницу через 10-20 секунд.
        </section>
      )}

      <section id="listings" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Исполнители</h2>
          <span className="text-sm text-muted-foreground">Найдено: {listings.length}</span>
        </div>

        {listings.length === 0 ? (
          <div className="surface p-6 text-sm text-muted-foreground">Ничего не найдено. Измените фильтры и попробуйте снова.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
