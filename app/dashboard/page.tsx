import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/forms/listing-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { StatusToggles } from "@/components/forms/status-toggles";
import { PromotionButton } from "@/components/forms/promotion-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "EXECUTOR") {
    redirect("/auth/role");
  }

  const [profile, listings, tariffs, user] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.listing.findMany({
      where: { userId: session.user.id },
      include: {
        tariffs: {
          where: { status: "ACTIVE", endsAt: { gt: new Date() } },
          include: { tariffPlan: { select: { kind: true } } },
          orderBy: { endsAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.tariffPlan.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { priceRub: "asc" }] }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { isBanned: true } })
  ]);

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Кабинет исполнителя</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Простой сценарий: заполните профиль, пополните баланс и опубликуйте анкету по тарифу.
        </p>
        {user?.isBanned && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            Аккаунт заблокирован. Публикация и отправка сообщений недоступны.
          </p>
        )}
      </section>

      <StatusToggles isOnline={profile?.isOnline ?? false} urgentToday={profile?.urgentToday ?? false} />

      <ProfileForm
        role={session.user.role}
        initial={{
          about: profile?.about ?? "",
          gender: profile?.gender ?? null,
          age: profile?.age ?? null,
          workCategory: profile?.workCategory ?? "",
          previousWork: profile?.previousWork ?? "",
          experienceYears: profile?.experienceYears ?? 0,
          skills: (profile?.skills ?? []).join(", "),
          availability: profile?.availability ?? "",
          phone: profile?.phone ?? ""
        }}
      />

      <ListingForm tariffs={tariffs} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Мои анкеты</h2>

        {listings.length === 0 ? (
          <div className="surface p-4 text-sm text-muted-foreground">Анкет пока нет.</div>
        ) : (
          listings.map((item) => {
            const activeTariffKind = item.tariffs[0]?.tariffPlan.kind ?? "BASIC";
            return (
              <article key={item.id} className="surface space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • {activeTariffKind}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.status === "ACTIVE" ? "Активно" : "На паузе"}</span>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  Срок размещения: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("ru-RU") : "не задан"}
                </p>

                <PromotionButton endpoint={`/api/listings/${item.id}/promote`} tariffs={tariffs} />

                <details className="rounded-lg border bg-background/70 p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Редактировать анкету</summary>
                  <div className="mt-3">
                    <ListingForm
                      listing={{
                        id: item.id,
                        title: item.title,
                        category: item.category,
                        description: item.description,
                        priceType: item.priceType,
                        priceValue: item.priceValue,
                        district: item.district,
                        status: item.status
                      }}
                      tariffs={tariffs}
                      compact
                    />
                  </div>
                </details>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
