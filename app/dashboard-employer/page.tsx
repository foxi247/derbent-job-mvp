import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureExpiringPublicationNotifications } from "@/lib/notifications";
import { ApplicationStatusActions } from "@/components/forms/application-status-actions";
import { JobForm } from "@/components/forms/job-form";
import { PromotionButton } from "@/components/forms/promotion-button";
import { CompleteJobButton } from "@/components/forms/complete-job-button";
import { ReviewForm } from "@/components/forms/review-form";

const applicationStatusLabel: Record<string, string> = {
  SENT: "Отправлен",
  VIEWED: "Просмотрен",
  ACCEPTED: "Принят",
  REJECTED: "Отклонен",
  COMPLETED: "Завершен",
  CANCELED: "Отменен"
};

export default async function EmployerDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "EMPLOYER") {
    redirect("/auth/role");
  }

  await ensureExpiringPublicationNotifications(session.user.id, session.user.role);

  const [jobPosts, applications, executors, tariffs, user] = await Promise.all([
    prisma.jobPost.findMany({
      where: { userId: session.user.id },
      include: {
        reviews: {
          include: {
            executor: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        tariffs: {
          where: { status: "ACTIVE", endsAt: { gt: new Date() } },
          include: { tariffPlan: { select: { kind: true } } },
          orderBy: { endsAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            messages: true,
            reviews: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.jobApplication.findMany({
      where: { employerUserId: session.user.id },
      include: {
        executor: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                experienceYears: true,
                workCategory: true
              }
            }
          }
        },
        jobPost: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 200
    }),
    prisma.user.findMany({
      where: { role: "EXECUTOR", isBanned: false },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.tariffPlan.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { priceRub: "asc" }] }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { isBanned: true } })
  ]);

  const executorOptions = executors.map((executor) => ({
    id: executor.id,
    name: executor.name ?? "Исполнитель"
  }));

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Кабинет работодателя</h1>
        <p className="mt-1 text-sm text-muted-foreground">Создайте задание, выберите тариф и получайте отклики.</p>
        {user?.isBanned && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            Аккаунт заблокирован. Публикация и отправка сообщений недоступны.
          </p>
        )}
      </section>

      <JobForm tariffs={tariffs} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Отклики</h2>
        {applications.length === 0 ? (
          <div className="surface p-4 text-sm text-muted-foreground">По вашим заданиям пока нет откликов.</div>
        ) : (
          <div className="space-y-2">
            {applications.map((application) => (
              <article key={application.id} className="surface flex items-start justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{application.jobPost.title}</p>
                  <p className="text-xs text-muted-foreground">{application.jobPost.category}</p>
                  <p className="mt-1">
                    {application.executor.name ?? "Исполнитель"} • {application.executor.profile?.workCategory ?? "Без категории"} • стаж{" "}
                    {application.executor.profile?.experienceYears ?? 0} лет
                  </p>
                  {application.message && <p className="mt-1 text-xs text-muted-foreground">Сообщение: {application.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Статус: {applicationStatusLabel[application.status]}</p>
                </div>
                {(application.status === "SENT" || application.status === "VIEWED") && (
                  <ApplicationStatusActions applicationId={application.id} />
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Мои задания</h2>

        {jobPosts.length === 0 ? (
          <div className="surface p-4 text-sm text-muted-foreground">Заданий пока нет.</div>
        ) : (
          jobPosts.map((jobPost) => {
            const activeTariffKind = jobPost.tariffs[0]?.tariffPlan.kind ?? "BASIC";
            return (
              <article key={jobPost.id} className="surface space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{jobPost.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {jobPost.category} • сообщений: {jobPost._count.messages} • {activeTariffKind}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {jobPost.status === "ACTIVE" ? "Активно" : jobPost.status === "PAUSED" ? "На паузе" : "Завершено"}
                  </span>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">{jobPost.description}</p>
                <p className="text-xs text-muted-foreground">
                  Срок размещения: {jobPost.expiresAt ? new Date(jobPost.expiresAt).toLocaleDateString("ru-RU") : "не задан"}
                </p>

                {jobPost.status !== "COMPLETED" && <PromotionButton endpoint={`/api/jobs/${jobPost.id}/promote`} tariffs={tariffs} />}

                <div className="flex flex-wrap gap-2">
                  {jobPost.status !== "COMPLETED" && <CompleteJobButton jobPostId={jobPost.id} />}
                </div>

                <details className="rounded-lg border bg-background/70 p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Редактировать задание</summary>
                  <div className="mt-3">
                    <JobForm
                      jobPost={{
                        id: jobPost.id,
                        title: jobPost.title,
                        category: jobPost.category,
                        description: jobPost.description,
                        payType: jobPost.payType,
                        payValue: jobPost.payValue,
                        district: jobPost.district,
                        phone: jobPost.phone,
                        urgentToday: jobPost.urgentToday,
                        status: jobPost.status
                      }}
                      tariffs={tariffs}
                      compact
                    />
                  </div>
                </details>

                {jobPost.status === "COMPLETED" && (
                  <div className="space-y-3">
                    <ReviewForm jobPostId={jobPost.id} executors={executorOptions} />

                    <div className="rounded-xl bg-secondary/45 p-3 text-sm">
                      <p className="font-medium">Оставленные отзывы: {jobPost._count.reviews}</p>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        {jobPost.reviews.length === 0 ? (
                          <p>Пока нет отзывов по этому заданию.</p>
                        ) : (
                          jobPost.reviews.map((review) => (
                            <p key={review.id}>
                              {review.rating}/5 • {review.executor.name ?? "Исполнитель"} •{" "}
                              {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
