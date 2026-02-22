import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/forms/listing-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { StatusToggles } from "@/components/forms/status-toggles";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "EXECUTOR") {
    redirect("/");
  }

  const [profile, listings] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.listing.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } })
  ]);

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Кабинет исполнителя</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Здесь вы управляете профилем (стаж, навыки) и объявлениями.
        </p>
      </section>

      <StatusToggles isOnline={profile?.isOnline ?? false} urgentToday={profile?.urgentToday ?? false} />

      <ProfileForm
        initial={{
          about: profile?.about ?? "",
          experienceYears: profile?.experienceYears ?? 0,
          skills: (profile?.skills ?? []).join(", "),
          availability: profile?.availability ?? ""
        }}
      />

      <ListingForm initialExperienceYears={profile?.experienceYears ?? 0} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Мои объявления</h2>

        {listings.length === 0 ? (
          <div className="surface p-4 text-sm text-muted-foreground">Объявлений пока нет.</div>
        ) : (
          listings.map((item) => (
            <article key={item.id} className="surface space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.status === "ACTIVE" ? "Активно" : "На паузе"}</span>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              <ListingForm listing={item} compact />
            </article>
          ))
        )}
      </section>

      <section className="surface bg-secondary/45 p-4 text-sm">
        <h2 className="font-semibold">Монетизация (TODO)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
          <li>Оплата за размещение на 1/7/30 дней</li>
          <li>Поднятие объявления в топ</li>
          <li>Цветовое выделение карточки</li>
        </ul>
      </section>
    </div>
  );
}
