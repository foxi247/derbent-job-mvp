import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JobForm } from "@/components/forms/job-form";
import { PromotionButton } from "@/components/forms/promotion-button";
import { CompleteJobButton } from "@/components/forms/complete-job-button";
import { ReviewForm } from "@/components/forms/review-form";

export default async function EmployerDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "EMPLOYER") {
    redirect("/auth/role");
  }

  const [jobPosts, executors] = await Promise.all([
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
        _count: {
          select: {
            messages: true,
            reviews: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: "EXECUTOR" },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const executorOptions = executors.map((executor) => ({
    id: executor.id,
    name: executor.name ?? "Исполнитель"
  }));

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Кабинет работодателя</h1>
        <p className="mt-1 text-sm text-muted-foreground">Создавайте задания, продлевайте размещение и отмечайте завершенные работы.</p>
      </section>

      <JobForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Мои задания</h2>

        {jobPosts.length === 0 ? (
          <div className="surface p-4 text-sm text-muted-foreground">Заданий пока нет.</div>
        ) : (
          jobPosts.map((jobPost) => (
            <article key={jobPost.id} className="surface space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{jobPost.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {jobPost.category} • сообщений: {jobPost._count.messages}
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

              <div className="flex flex-wrap gap-2">
                <PromotionButton endpoint={`/api/jobs/${jobPost.id}/promote`} />
                {jobPost.status !== "COMPLETED" && <CompleteJobButton jobPostId={jobPost.id} />}
              </div>

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
                compact
              />

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
                            {review.rating}/5 • {review.executor.name ?? "Исполнитель"} • {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
