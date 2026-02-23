import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { FavoriteToggle } from "@/components/common/favorite-toggle";
import { ContactReveal } from "@/components/forms/contact-reveal";
import { JobApplyWidget } from "@/components/forms/job-apply-widget";
import { MessageForm } from "@/components/forms/message-form";
import { ReportMenu } from "@/components/forms/report-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAY_TYPE_LABELS } from "@/lib/constants";
import { maskPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

type JobPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, description: true, category: true }
  });

  if (!job) {
    return {
      title: "Задание не найдено",
      alternates: { canonical: `${getBaseUrl()}/jobs/${params.id}` }
    };
  }

  const title = `${job.title} - ${job.category} в Дербенте`;
  const description = job.description.slice(0, 180);
  const canonical = `${getBaseUrl()}/jobs/${job.id}`;

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

export default async function JobPage({ params }: JobPageProps) {
  const session = await auth();

  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              phone: true
            }
          }
        }
      }
    }
  });

  if (!job) {
    notFound();
  }

  const [application, favorite] = await Promise.all([
    session?.user?.role === "EXECUTOR"
      ? prisma.jobApplication.findUnique({
          where: {
            jobPostId_executorUserId: {
              jobPostId: job.id,
              executorUserId: session.user.id
            }
          },
          select: { id: true, status: true, message: true }
        })
      : Promise.resolve(null),
    session?.user
      ? prisma.favorite.findUnique({
          where: {
            userId_jobPostId: {
              userId: session.user.id,
              jobPostId: job.id
            }
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  const ownerPhone = job.phone ?? job.user.profile?.phone ?? null;
  const maskedPhone = maskPhone(ownerPhone);
  const isExecutor = session?.user?.role === "EXECUTOR";
  const hasAcceptedApplication = application?.status === "ACCEPTED" || application?.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/jobs">Назад к заданиям</Link>
        </Button>
        <div className="flex items-center gap-1">
          <FavoriteToggle targetType="JOB" jobPostId={job.id} initialActive={Boolean(favorite)} />
          {session?.user && <ReportMenu targetType="JOB" jobPostId={job.id} />}
        </div>
      </div>

      <section className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.category} • {job.user.name ?? "Работодатель"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">{job.payType === "NEGOTIABLE" ? "Договорная" : `${job.payValue ?? "-"} ₽`}</p>
            <p className="text-sm text-muted-foreground">{PAY_TYPE_LABELS[job.payType]}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{job.description}</p>

        <div className="flex flex-wrap gap-2">
          {job.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно</Badge>}
          <Badge>{job.district ? `Район: ${job.district}` : "Дербент"}</Badge>
          <Badge>{job.status === "ACTIVE" ? "Активно" : job.status === "PAUSED" ? "На паузе" : "Завершено"}</Badge>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface space-y-3 p-5">
          <h2 className="text-lg font-semibold">Контакты работодателя</h2>
          <ContactReveal maskedPhone={maskedPhone} jobPostId={job.id} hasPhone={Boolean(ownerPhone)} />
        </article>

        <article className="surface space-y-3 p-5">
          <h2 className="text-lg font-semibold">Отклик</h2>

          {!session?.user && (
            <Button asChild className="w-full">
              <Link href="/auth/signin">Войти и откликнуться</Link>
            </Button>
          )}

          {session?.user && isExecutor && <JobApplyWidget jobPostId={job.id} initialApplication={application} />}

          {session?.user && isExecutor && !hasAcceptedApplication && (
            <p className="text-sm text-muted-foreground">Переписка откроется после принятия отклика работодателем.</p>
          )}

          {session?.user && isExecutor && hasAcceptedApplication && (
            <MessageForm jobPostId={job.id} title="Написать работодателю" />
          )}

          {session?.user && !isExecutor && (
            <p className="text-sm text-muted-foreground">
              Отклик доступен только исполнителям. Управление заданиями в кабинете работодателя.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
